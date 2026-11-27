// Sign-in codes, sessions and company workspaces.

import crypto from 'node:crypto';
import { get, set, setNew, del } from './store.js';
import { cookies } from './http.js';
import { initialWorkspace, nameFromEmail } from '../../src/workspace/model.js';

export const SESSION_DAYS = 30;
const PUBLIC_DOMAINS = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'outlook.com', 'hotmail.com', 'hotmail.co.uk', 'live.com', 'live.co.uk', 'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com', 'mail.com', 'zoho.com', 'yandex.com', 'btinternet.com', 'sky.com', 'virginmedia.com', 'ymail.com']);

export const normEmail = (e) => String(e || '').trim().toLowerCase();
export const validEmail = (e) => /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 160;
export const domainOf = (e) => e.split('@')[1] || '';
export const isPublicDomain = (d) => PUBLIC_DOMAINS.has(d);
export const workspaceIdFor = (email) => (isPublicDomain(domainOf(email)) ? 'p:' + email : 'd:' + domainOf(email));

const hash = (code, salt) => crypto.createHash('sha256').update(salt + ':' + code).digest('hex');
export const newCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

export async function storeCode(email, code, extra) {
  const salt = crypto.randomBytes(8).toString('hex');
  await set('otp:' + email, { h: hash(code, salt), salt, attempts: 0, ...extra }, 600);
}

/** Returns { ok, reason, rec } */
export async function checkCode(email, code) {
  const rec = await get('otp:' + email);
  if (!rec) return { ok: false, reason: 'expired' };
  if (rec.attempts >= 5) { await del('otp:' + email); return { ok: false, reason: 'locked' }; }
  const good = crypto.timingSafeEqual(Buffer.from(hash(String(code), rec.salt)), Buffer.from(rec.h));
  if (!good) {
    rec.attempts += 1;
    await set('otp:' + email, rec, 600);
    return { ok: false, reason: rec.attempts >= 5 ? 'locked' : 'wrong', left: 5 - rec.attempts };
  }
  await del('otp:' + email);
  return { ok: true, rec };
}

export async function workspaceFor(email) {
  return get('ws:' + workspaceIdFor(email));
}

/** Create the workspace if this is the first person from the company, otherwise join it as a member. */
export async function joinOrCreate(email, name, draft, now) {
  const id = workspaceIdFor(email);
  const display = (name || '').trim().slice(0, 60) || nameFromEmail(email);
  let ws = await get('ws:' + id);
  if (!ws) {
    const people = { [email]: { id: email, name: display, role: 'owner', team: 'Owner', email } };
    const state = initialWorkspace(draft || {}, people, email, now || new Date().toISOString(), false, false);
    const fresh = { id, domain: domainOf(email), personal: isPublicDomain(domainOf(email)), createdAt: Date.now(), owner: email, state };
    if (await setNew('ws:' + id, fresh)) {
      try { const idx = (await get('ws:index')) || []; if (idx.indexOf(id) < 0) { idx.unshift(id); await set('ws:index', idx.slice(0, 5000)); } } catch (e) { /* index is best effort */ }
      return { ws: fresh, role: 'owner', created: true };
    }
    ws = await get('ws:' + id);
  }
  const p = ws.state.people[email];
  if (p) {
    if (name && name.trim() && p.name !== name.trim()) { p.name = name.trim().slice(0, 60); await set('ws:' + id, ws); }
    return { ws, role: p.role, created: false };
  }
  ws.state.people[email] = { id: email, name: display, role: 'member', team: ws.state.team || 'Team', email };
  await set('ws:' + id, ws);
  return { ws, role: 'member', created: false, joined: true };
}

export async function createSession(email) {
  const token = crypto.randomBytes(24).toString('base64url');
  await set('sess:' + token, { email, at: Date.now() }, SESSION_DAYS * 86400);
  return token;
}

export async function currentUser(req) {
  const token = cookies(req).kc_session;
  if (!token || token.length > 80) return null;
  const s = await get('sess:' + token);
  if (!s || !s.email) return null;
  const ws = await workspaceFor(s.email);
  if (!ws) return null;
  const me = ws.state.people[s.email];
  if (!me) return null;
  return { token, email: s.email, me, ws };
}

export async function endSession(req) {
  const token = cookies(req).kc_session;
  if (token) await del('sess:' + token);
}

export function publicView(u) {
  return { signedIn: true, me: { email: u.email, name: u.me.name, role: u.me.role, team: u.me.team }, workspace: u.ws.state, personal: !!u.ws.personal, domain: u.ws.domain };
}

/** Klarnow team members who can assign numbers (comma-separated OPS_EMAILS in Vercel). */
export const isOps = (email) => String(process.env.OPS_EMAILS || '').toLowerCase().split(/[\s,]+/).filter(Boolean).includes(String(email || '').toLowerCase());
