import { send } from './_lib/http.js';
import { storeReady } from './_lib/store.js';
import { mailReady } from './_lib/mail.js';
import { currentUser, publicView } from './_lib/auth.js';

export default async function handler(req, res) {
  const ready = storeReady() && mailReady();
  if (!storeReady()) return send(res, 200, { signedIn: false, ready });
  try {
    const u = await currentUser(req);
    if (!u) return send(res, 200, { signedIn: false, ready });
    return send(res, 200, { ...publicView(u), ready });
  } catch (e) {
    console.error('me', e);
    return send(res, 200, { signedIn: false, ready, error: 'server' });
  }
}
