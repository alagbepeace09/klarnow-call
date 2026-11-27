// Key-value store. Production: Upstash Redis over REST (added from Vercel Storage → Upstash for Redis).
// Local development (LOCAL_DEV=1): an in-memory map, so the journey can be tested without accounts.

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const LOCAL = process.env.LOCAL_DEV === '1';

const mem = globalThis.__kcMem || (globalThis.__kcMem = new Map());

export const storeReady = () => LOCAL || (!!URL_ && !!TOKEN);

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error('store_error: ' + (j.error || r.status));
  return j.result;
}

function memGet(key) {
  const e = mem.get(key);
  if (!e) return null;
  if (e.exp && e.exp < Date.now()) { mem.delete(key); return null; }
  return e.v;
}

export async function get(key) {
  if (LOCAL) { const v = memGet(key); return v == null ? null : JSON.parse(v); }
  const v = await redis(['GET', key]);
  if (v == null) return null;
  try { return JSON.parse(v); } catch (e) { return v; }
}

export async function set(key, value, ttlSeconds) {
  const v = JSON.stringify(value);
  if (LOCAL) { mem.set(key, { v, exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 }); return; }
  await redis(ttlSeconds ? ['SET', key, v, 'EX', String(ttlSeconds)] : ['SET', key, v]);
}

/** Set only if missing. Returns true when this call created the key. */
export async function setNew(key, value, ttlSeconds) {
  const v = JSON.stringify(value);
  if (LOCAL) {
    if (memGet(key) != null) return false;
    mem.set(key, { v, exp: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
    return true;
  }
  const cmd = ['SET', key, v, 'NX'];
  if (ttlSeconds) cmd.push('EX', String(ttlSeconds));
  return (await redis(cmd)) === 'OK';
}

export async function del(key) {
  if (LOCAL) { mem.delete(key); return; }
  await redis(['DEL', key]);
}

/** Increment a counter that expires after ttlSeconds from first use. */
export async function hit(key, ttlSeconds) {
  if (LOCAL) {
    const n = (parseInt(memGet(key) || '0', 10) || 0) + 1;
    const e = mem.get(key);
    mem.set(key, { v: String(n), exp: e && e.exp ? e.exp : Date.now() + ttlSeconds * 1000 });
    return n;
  }
  const n = await redis(['INCR', key]);
  if (n === 1) await redis(['EXPIRE', key, String(ttlSeconds)]);
  return n;
}
