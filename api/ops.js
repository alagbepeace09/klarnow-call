// Klarnow team page: see number requests and assign real numbers to workspaces.
import { readBody, send, methodNotAllowed } from './_lib/http.js';
import { get, set, storeReady } from './_lib/store.js';
import { cookies } from './_lib/http.js';
import { isOps } from './_lib/auth.js';

async function opsUser(req) {
  const token = cookies(req).kc_session;
  if (!token || token.length > 80) return null;
  const s = await get('sess:' + token);
  return s && s.email ? s.email : null;
}

const summary = (ws) => {
  const s = ws.state;
  const owner = s.people[s.owner] || {};
  return { id: ws.id, biz: s.biz, url: s.url, domain: ws.domain, personal: !!ws.personal, owner: owner.email || s.owner, ownerName: owner.name || '', team: Object.keys(s.people).length, number: s.number && typeof s.number === 'object' ? s.number : { status: 'none' }, createdAt: ws.createdAt };
};

export default async function handler(req, res) {
  if (!storeReady()) return send(res, 503, { error: 'storage_not_configured' });
  const email = await opsUser(req).catch(() => null);
  if (!email) return send(res, 401, { error: 'signed_out', message: 'Sign in with your Klarnow team email.' });
  if (!isOps(email)) return send(res, 403, { error: 'not_ops', message: email + ' isn’t on the Klarnow team list (OPS_EMAILS in Vercel).' });

  if (req.method === 'GET') {
    const idx = (await get('ws:index')) || [];
    const list = [];
    for (const id of idx.slice(0, 300)) { const ws = await get('ws:' + id); if (ws) list.push(summary(ws)); }
    return send(res, 200, { ok: true, me: email, workspaces: list });
  }
  if (req.method !== 'POST') return methodNotAllowed(res);
  const { id, action, number } = await readBody(req);
  const ws = await get('ws:' + String(id || ''));
  if (!ws) return send(res, 404, { error: 'not_found', message: 'That workspace no longer exists.' });
  const cur = ws.state.number && typeof ws.state.number === 'object' ? ws.state.number : { status: 'none' };
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  if (action === 'assign') {
    const n = String(number || '').trim();
    if (!/^\+?[\d\s()-]{7,20}$/.test(n)) return send(res, 400, { error: 'bad_number', message: 'Enter a phone number like +44 161 555 0123.' });
    ws.state.number = { ...cur, status: 'assigned', value: n, assignedAt: stamp, assignedBy: email };
  } else if (action === 'live') {
    if (!cur.value) return send(res, 400, { error: 'no_number', message: 'Assign a number first.' });
    ws.state.number = { ...cur, status: 'live', liveAt: stamp };
  } else if (action === 'unassign') {
    ws.state.number = { ...cur, status: cur.kind ? 'requested' : 'none', value: '', assignedAt: null, liveAt: null };
  } else return send(res, 400, { error: 'bad_action' });
  await set('ws:' + ws.id, ws);
  return send(res, 200, { ok: true, workspace: summary(ws) });
}
