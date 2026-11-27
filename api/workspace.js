import { readBody, send, methodNotAllowed } from './_lib/http.js';
import { set, storeReady } from './_lib/store.js';
import { currentUser, publicView } from './_lib/auth.js';
import { reducer, withExamples, WRITE_ACTIONS } from '../src/workspace/model.js';

export default async function handler(req, res) {
  if (!storeReady()) return send(res, 503, { error: 'storage_not_configured' });
  const u = await currentUser(req).catch(() => null);
  if (!u) return send(res, 401, { error: 'signed_out', message: 'Your session ended. Sign in again.' });
  if (req.method === 'GET') return send(res, 200, publicView(u));
  if (req.method !== 'POST') return methodNotAllowed(res);

  const { action } = await readBody(req);
  if (!action || typeof action !== 'object' || typeof action.type !== 'string') return send(res, 400, { error: 'bad_action' });
  const isOwner = u.me.role === 'owner';
  const EX = ['load-examples', 'clear-examples', 'reset-samples'];
  if ((WRITE_ACTIONS.includes(action.type) || EX.includes(action.type)) && !isOwner) {
    return send(res, 403, { error: 'forbidden', message: 'Only owners and admins can change this. Nothing was changed.' });
  }
  if (!WRITE_ACTIONS.includes(action.type) && !EX.includes(action.type)) return send(res, 400, { error: 'bad_action' });
  try {
    const s = u.ws.state;
    let next;
    const nowIso = String(action.nowIso || '').slice(0, 25) || new Date().toISOString();
    if (action.type === 'load-examples' || action.type === 'reset-samples') {
      next = withExamples(s, true, nowIso);
    } else if (action.type === 'clear-examples') {
      next = withExamples(s, false);
    } else {
      const a = { ...action, actor: u.email };
      if (a.owner && !s.people[a.owner]) a.owner = null;
      if (a.spokeBy && !s.people[a.spokeBy]) a.spokeBy = u.email;
      ['reason', 'time', 'email', 'party', 'next'].forEach((k) => { if (a[k] != null) a[k] = String(a[k]).slice(0, 160); });
      next = reducer(s, a);
    }
    u.ws.state = next;
    await set('ws:' + u.ws.id, u.ws);
    return send(res, 200, publicView(u));
  } catch (e) {
    console.error('workspace', e);
    return send(res, 500, { error: 'server', message: 'Couldn’t save. Nothing changed. Try again.' });
  }
}
