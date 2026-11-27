import { send, sessionCookie, methodNotAllowed } from './_lib/http.js';
import { storeReady } from './_lib/store.js';
import { endSession } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  try { if (storeReady()) await endSession(req); } catch (e) { /* ignore */ }
  return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
}
