import { readBody, send, ipOf, methodNotAllowed } from './_lib/http.js';
import { hit, storeReady } from './_lib/store.js';
import { scanSite } from './_lib/scan.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res);
  const { url } = await readBody(req);
  if (!url || String(url).length > 300) return send(res, 400, { error: 'bad_url', message: 'Enter a website address like yourbusiness.co.uk.' });
  try {
    if (storeReady() && (await hit('rl:scan:' + ipOf(req), 3600)) > 40) {
      return send(res, 429, { error: 'too_many', message: 'Too many website reads from this connection. Try again in an hour, or enter details yourself.' });
    }
  } catch (e) { /* rate limit is best effort */ }
  try {
    const site = await scanSite(url);
    return send(res, 200, { ok: true, site });
  } catch (e) {
    const m = String(e && e.message || '');
    const why = m === 'bad_url' ? 'That doesn’t look like a website address.'
      : m.startsWith('bad_') ? 'That address can’t be read.'
        : m === 'AbortError' || /abort/i.test(m) ? 'The site took too long to respond.'
          : m.startsWith('status_') ? 'The site answered with an error (' + m.slice(7) + ').'
            : m === 'not_html' ? 'That address isn’t a web page.'
              : /ENOTFOUND|getaddrinfo/.test(m) ? 'We couldn’t find a website at that address.'
                : 'The site couldn’t be opened.';
    return send(res, 422, { error: 'unreadable', message: why });
  }
}
