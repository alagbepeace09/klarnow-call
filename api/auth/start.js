import { readBody, send, ipOf, methodNotAllowed } from '../_lib/http.js';
import { hit, get, set, storeReady } from '../_lib/store.js';
import { mailReady, sendCode } from '../_lib/mail.js';
import { normEmail, validEmail, newCode, storeCode, workspaceFor } from '../_lib/auth.js';

const cleanDraft = (d) => {
  if (!d || typeof d !== 'object') return {};
  const str = (v, n) => String(v || '').slice(0, n);
  return {
    bizName: str(d.bizName, 80), klaroName: str(d.klaroName, 30), kind: str(d.kind, 20), voice: str(d.voice, 10), url: str(d.url, 200),
    bizDesc: str(d.bizDesc, 400), greeting: str(d.greeting, 400), testCall: str(d.testCall, 12),
    services: Array.isArray(d.services) ? d.services.slice(0, 12).map((x) => str(x, 60)) : [],
    facts: Array.isArray(d.facts) ? d.facts.slice(0, 10).map((f) => ({ k: str(f && f.k, 40), v: str(f && f.v, 120) })) : []
  };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const body = await readBody(req);
  const email = normEmail(body.email);
  if (!validEmail(email)) return send(res, 400, { error: 'bad_email', message: 'Enter an email address like name@business.co.uk.' });
  if (!storeReady()) return send(res, 503, { error: 'storage_not_configured', message: 'Sign-in isn’t switched on for this site yet (no database connected).' });
  if (!mailReady()) return send(res, 503, { error: 'email_not_configured', message: 'Sign-in isn’t switched on for this site yet (no email service connected).' });
  try {
    const ip = ipOf(req);
    if ((await hit('rl:start:ip:' + ip, 3600)) > 30) return send(res, 429, { error: 'too_many', message: 'Too many codes requested from this connection. Try again in an hour.' });
    const wait = await get('otpwait:' + email);
    if (wait) return send(res, 429, { error: 'wait', message: 'A code was just sent. You can ask for a new one in a few seconds.', retryIn: 30 });
    if ((await hit('rl:start:em:' + email, 3600)) > 6) return send(res, 429, { error: 'too_many', message: 'Too many codes for this email. Try again in an hour.' });

    const name = String(body.name || '').trim().slice(0, 60);
    const draft = cleanDraft(body.draft);
    const existing = await workspaceFor(email);
    const code = newCode();
    await storeCode(email, code, { name, draft, now: String(body.now || '').slice(0, 25) });
    await set('otpwait:' + email, 1, 30);
    const sent = await sendCode(email, code, name, existing ? existing.state.biz : draft.bizName);
    if (!sent.ok) return send(res, 502, { error: 'send_failed', message: 'We couldn’t send the email just now. Try again in a moment.' });
    const out = { ok: true, retryIn: 30, joining: existing && !existing.state.people[email] ? existing.state.biz : null, returning: !!(existing && existing.state.people[email]) };
    if (sent.local) out.devCode = code; // local development only
    return send(res, 200, out);
  } catch (e) {
    console.error('auth_start', e);
    return send(res, 500, { error: 'server', message: 'Something went wrong on our side. Try again.' });
  }
}
