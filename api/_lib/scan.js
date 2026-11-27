// Reads a business website and pulls out what Klaro needs: name, description, phone,
// email, address, opening hours, services and the kind of business.
// Guards against fetching private/internal addresses (SSRF).

import { lookup } from 'node:dns/promises';
import net from 'node:net';

const MAX_BYTES = 1_500_000;
const UA = 'Mozilla/5.0 (compatible; KlaroCallReader/1.0; reads public business pages to set up a receptionist)';

function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const x = ip.toLowerCase();
  if (x.startsWith('::ffff:')) return privateIp(x.slice(7));
  return x === '::1' || x === '::' || x.startsWith('fc') || x.startsWith('fd') || x.startsWith('fe80');
}

async function assertPublic(u) {
  if (!/^https?:$/.test(u.protocol)) throw new Error('bad_protocol');
  if (u.port && !['80', '443', ''].includes(u.port)) throw new Error('bad_port');
  const host = u.hostname;
  if (!host.includes('.') || /\.(local|internal|localhost)$/i.test(host)) throw new Error('bad_host');
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => privateIp(a.address))) throw new Error('bad_host');
}

async function fetchPage(startUrl, ms = 9000) {
  let url = new URL(startUrl);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    for (let hop = 0; hop < 4; hop++) {
      await assertPublic(url);
      const r = await fetch(url, { redirect: 'manual', signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' } });
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { url = new URL(r.headers.get('location'), url); continue; }
      if (!r.ok) throw new Error('status_' + r.status);
      const type = r.headers.get('content-type') || '';
      if (!/html/i.test(type)) throw new Error('not_html');
      const reader = r.body.getReader();
      const chunks = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length; chunks.push(value);
        if (size > MAX_BYTES) { ctrl.abort(); break; }
      }
      return { html: Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8'), finalUrl: url.toString() };
    }
    throw new Error('too_many_redirects');
  } finally { clearTimeout(timer); }
}

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', hellip: '…' };
const decode = (s) => (s || '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] != null ? ENT[e.toLowerCase()] : m;
});
const clean = (s) => decode((s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const meta = (html, name) => {
  const re = new RegExp('<meta[^>]+(?:name|property)=["\']' + name + '["\'][^>]*>', 'i');
  const tag = (html.match(re) || [])[0];
  return tag ? clean((tag.match(/content=["']([^"']*)["']/i) || [])[1]) : '';
};

function jsonLd(html) {
  const out = [];
  const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const j = JSON.parse(m[1].trim());
      const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { out.push(x); if (x['@graph']) walk(x['@graph']); } };
      walk(j);
    } catch (e) { /* ignore broken blocks */ }
  }
  return out;
}

const BIZ_TYPES = /LocalBusiness|Restaurant|FoodEstablishment|CafeOrCoffeeShop|BarOrPub|Dentist|MedicalBusiness|HairSalon|BeautySalon|HealthAndBeautyBusiness|Plumber|Electrician|HomeAndConstructionBusiness|Store|ProfessionalService|Organization|AutoRepair|LegalService|Hotel|NailSalon|DaySpa/i;

function addressText(a) {
  if (!a) return '';
  if (typeof a === 'string') return clean(a);
  if (Array.isArray(a)) return addressText(a[0]);
  return [a.streetAddress, a.addressLocality, a.postalCode].filter(Boolean).map(clean).join(', ');
}

function hoursText(b) {
  if (!b) return '';
  if (typeof b.openingHours === 'string') return clean(b.openingHours);
  if (Array.isArray(b.openingHours)) return b.openingHours.slice(0, 3).map(clean).join(' · ');
  const spec = b.openingHoursSpecification;
  if (Array.isArray(spec) && spec.length) {
    const s = spec[0];
    const days = [].concat(s.dayOfWeek || []).map((d) => String(d).split('/').pop().slice(0, 3));
    if (s.opens && s.closes) return (days.length ? days[0] + (days.length > 1 ? '–' + days[days.length - 1] : '') + ' ' : '') + String(s.opens).slice(0, 5) + '–' + String(s.closes).slice(0, 5);
  }
  return '';
}

const SKIP = /^(home|about|about us|contact|contact us|menu|blog|news|login|log in|sign in|cart|basket|search|faq|faqs|privacy|terms|cookies?|gallery|careers|jobs|shop|book now|book|get in touch|follow us|our story|team|meet the team|testimonials|reviews|subscribe|newsletter|skip to content|close|open menu)$/i;

function services(html, kind) {
  const found = [];
  const seen = new Set();
  const add = (t) => {
    const s = clean(t).replace(/[|•·:]+$/g, '').trim();
    if (s.length < 4 || s.length > 38 || SKIP.test(s) || /navigation|main menu|footer|header|cookie|sign ?up|log ?in|subscribe|newsletter|copyright|all rights|follow|share this|read more|learn more|see more|view all/i.test(s) || /[{}<>@©]|\d{4,}|^\W/.test(s) || s.split(' ').length > 5) return;
    const k = s.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k); found.push(s.charAt(0).toUpperCase() + s.slice(1));
  };
  (html.match(/<h[23][^>]*>[\s\S]*?<\/h[23]>/gi) || []).forEach(add);
  if (found.length < 3) (html.match(/<li[^>]*>\s*<a[^>]*>[\s\S]{3,60}?<\/a>/gi) || []).slice(0, 40).forEach(add);
  const words = { restaurant: /book|table|dining|menu|lunch|dinner|brunch|private|event|takeaway|delivery|vegan|cocktail/i,
    plumbing: /repair|install|boiler|heating|leak|emergency|bathroom|drain|service|gas/i,
    dental: /check|clean|whiten|implant|brace|invisalign|emergency|hygien|crown|filling/i,
    salon: /cut|colour|color|braid|style|nail|lash|brow|treatment|wax|blow|extension/i };
  const rx = words[kind];
  const ranked = rx ? found.filter((s) => rx.test(s)).concat(found.filter((s) => !rx.test(s))) : found;
  return ranked.slice(0, 5);
}

export function kindOf(text) {
  const t = text.toLowerCase();
  const score = {
    restaurant: (t.match(/restaurant|menu|dining|cuisine|table|brunch|dinner|lunch|kitchen|bistro|cafe|café|bar |cocktail|takeaway|chef/g) || []).length,
    plumbing: (t.match(/plumb|boiler|heating|gas safe|electrician|roofing|builder|joinery|leak|drain|central heating/g) || []).length,
    dental: (t.match(/dental|dentist|teeth|tooth|orthodont|hygienist|invisalign|implant/g) || []).length,
    salon: (t.match(/salon|hair|beauty|nails|barber|braid|lashes|brows|spa |stylist|blow dry/g) || []).length
  };
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  return best[1] >= 3 ? best[0] : 'general';
}

const PHONE = /(?:\+44\s?\(?0?\)?\s?|\b0)(?:\d[\s-]?){9,10}\b|\+\d{1,3}[\s-]?\(?\d{1,4}\)?(?:[\s-]?\d{2,4}){2,4}/;

export async function scanSite(input) {
  let raw = String(input || '').trim();
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
  let u;
  try { u = new URL(raw); } catch (e) { throw new Error('bad_url'); }
  let page;
  try { page = await fetchPage(u.toString()); } catch (e) {
    if (u.protocol === 'https:' && !/^bad_/.test(e.message)) { u.protocol = 'http:'; page = await fetchPage(u.toString()); } else throw e;
  }
  const { html, finalUrl } = page;
  const host = new URL(finalUrl).hostname.replace(/^www\./, '');
  const lds = jsonLd(html);
  const biz = lds.find((x) => BIZ_TYPES.test([].concat(x['@type'] || []).join(' '))) || {};
  const body = clean(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' '));

  const ogName = meta(html, 'og:site_name');
  const title = clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
  const titleName = title.split(/\s[|\-–—:·]\s/)[0].trim();
  let name = clean(biz.name) || ogName || titleName;
  if (!name || name.length > 48) name = host.split('.')[0];

  const description = (clean(biz.description) || meta(html, 'description') || meta(html, 'og:description')).slice(0, 280);
  const telLink = (html.match(/href=["']tel:([^"']+)["']/i) || [])[1];
  let phone = clean(biz.telephone) || (telLink ? decodeURIComponent(telLink).replace(/[^\d+ ]/g, '').trim() : '') || ((body.match(PHONE) || [])[0] || '').trim();
  const mail = clean(biz.email).replace(/^mailto:/, '') || ((html.match(/href=["']mailto:([^"'?]+)/i) || [])[1] || '');
  const address = addressText(biz.address);
  const hours = hoursText(biz);
  const kind = kindOf([name, description, title, body.slice(0, 20000)].join(' ') + ' ' + [].concat(biz['@type'] || []).join(' ').replace(/([a-z])([A-Z])/g, '$1 $2'));

  if (!phone) {
    for (const p of ['/contact', '/contact-us']) {
      try {
        const c = await fetchPage(new URL(p, finalUrl).toString(), 5000);
        const t = (c.html.match(/href=["']tel:([^"']+)["']/i) || [])[1];
        phone = t ? decodeURIComponent(t).replace(/[^\d+ ]/g, '').trim() : ((clean(c.html).match(PHONE) || [])[0] || '').trim();
        if (phone) break;
      } catch (e) { /* contact page optional */ }
    }
  }

  return {
    url: finalUrl, host, name, description, phone, email: mail, address, hours, kind,
    services: services(html, kind),
    found: { name: !!name, description: !!description, phone: !!phone, email: !!mail, address: !!address, hours: !!hours }
  };
}
