// Sends the sign-in code with Resend (https://resend.com).
// Needs RESEND_API_KEY and MAIL_FROM (e.g. "Klaro Call <hello@yourdomain.com>") in Vercel.

const KEY = process.env.RESEND_API_KEY || '';
const FROM = process.env.MAIL_FROM || 'Klaro Call <onboarding@resend.dev>';
const LOCAL = process.env.LOCAL_DEV === '1';

export const mailReady = () => LOCAL || !!KEY;

const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));

function html(code, name, biz) {
  const digits = code.split('').map((d) => '<td style="width:44px;height:56px;border-radius:12px;background:#f4f4f2;border:1px solid #e6e6e3;font:600 26px/56px ui-monospace,Menlo,Consolas,monospace;color:#121214;text-align:center">' + d + '</td>').join('<td style="width:8px"></td>');
  return '<!doctype html><html><body style="margin:0;background:#ebebea;padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#121214">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">' +
    '<table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:28px;padding:32px;border:1px solid #e3e3e0" cellpadding="0" cellspacing="0">' +
    '<tr><td style="font-size:15px;color:#121214"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#7346ff;margin-right:8px"></span>klaro<span style="color:#8d8d93">call</span></td></tr>' +
    '<tr><td style="padding-top:28px;font-size:28px;line-height:1.15;letter-spacing:-0.02em">Your sign-in code</td></tr>' +
    '<tr><td style="padding-top:10px;font-size:15px;line-height:1.55;color:#3d3d42">' + (name ? 'Hi ' + esc(name.split(' ')[0]) + ', enter' : 'Enter') + ' this code to save ' + (biz ? esc(biz) + '’s receptionist' : 'your receptionist') + '. It works for 10 minutes.</td></tr>' +
    '<tr><td style="padding-top:22px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>' + digits + '</tr></table></td></tr>' +
    '<tr><td style="padding-top:24px;font-size:13px;line-height:1.55;color:#8d8d93">If you didn’t ask for this, you can ignore this email. Nobody can sign in without the code.</td></tr>' +
    '</table></td></tr></table></body></html>';
}

export async function sendCode(to, code, name, biz) {
  if (LOCAL && !KEY) {
    console.log('[local] sign-in code for ' + to + ': ' + code);
    return { ok: true, local: true };
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM, to: [to],
      subject: code + ' is your Klaro Call code',
      html: html(code, name, biz),
      text: 'Your Klaro Call sign-in code is ' + code + '. It works for 10 minutes. If you didn’t ask for this, ignore this email.'
    })
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    console.error('resend_error', r.status, j && (j.message || j.name));
    return { ok: false, status: r.status, message: j && j.message };
  }
  return { ok: true };
}
