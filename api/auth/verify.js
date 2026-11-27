import { readBody, send, ipOf, sessionCookie, methodNotAllowed } from '../_lib/http.js';
import { hit, storeReady } from '../_lib/store.js';
import { normEmail, validEmail, checkCode, joinOrCreate, createSession, SESSION_DAYS, publicView } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  if (!storeReady()) return send(res, 503, { error: 'storage_not_configured', message: 'Sign-in isn’t switched on for this site yet.' });
  const body = await readBody(req);
  const email = normEmail(body.email);
  const code = String(body.code || '').replace(/\D/g, '');
  if (!validEmail(email) || code.length !== 6) return send(res, 400, { error: 'bad_input', message: 'Enter all 6 digits.' });
  try {
    if ((await hit('rl:verify:ip:' + ipOf(req), 3600)) > 60) return send(res, 429, { error: 'too_many', message: 'Too many attempts. Try again later.' });
    const r = await checkCode(email, code);
    if (!r.ok) {
      const msg = r.reason === 'expired' ? 'That code has expired. Send a new one.'
        : r.reason === 'locked' ? 'Too many wrong tries. Send a new code.'
          : 'That code doesn’t match. ' + r.left + ' tr' + (r.left === 1 ? 'y' : 'ies') + ' left.';
      return send(res, 400, { error: r.reason, message: msg });
    }
    const j = await joinOrCreate(email, r.rec.name, r.rec.draft, r.rec.now || undefined);
    const token = await createSession(email);
    const view = publicView({ email, me: j.ws.state.people[email], ws: j.ws });
    return send(res, 200, { ok: true, ...view, created: j.created, joined: !!j.joined }, { 'Set-Cookie': sessionCookie(token, SESSION_DAYS * 86400) });
  } catch (e) {
    console.error('auth_verify', e);
    return send(res, 500, { error: 'server', message: 'Something went wrong on our side. Try again.' });
  }
}
