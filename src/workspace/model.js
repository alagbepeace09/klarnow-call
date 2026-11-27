// Workspace model, shared by the browser and the API.
// A workspace holds the business (from the user's own website or details), its team,
// and a set of clearly labelled sample calls until a real number is live.

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const fmt = (mins) => String(Math.floor(((mins % 1440) + 1440) % 1440 / 60)).padStart(2, '0') + ':' + String(((mins % 60) + 60) % 60).padStart(2, '0');
export const hhmm = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
export const dayLabel = (d) => DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
export const longLabel = (d) => DAYS_LONG[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_LONG[d.getMonth()];
const addMin = (d, m) => new Date(d.getTime() + m * 60000);
const at = (d, days, h, m) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + days); x.setHours(h, m, 0, 0); return x; };
const slot = (d) => DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ', ' + hhmm(d);
const first = (n) => String(n || '').split(' ')[0];

export function nameFromEmail(email) {
  const local = String(email || '').split('@')[0].replace(/[0-9]+/g, ' ');
  const parts = local.split(/[._\-+ ]+/).filter((w) => w.length > 1).slice(0, 2);
  if (!parts.length) return 'Team member';
  return parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export const SAMPLE_PEOPLE = {
  dami: { id: 'dami', name: 'Dami Ade', role: 'owner', team: 'Owner', email: 'dami@canalstreetkitchen.co.uk' },
  tolu: { id: 'tolu', name: 'Tolu Bello', role: 'member', team: 'Reservations', email: 'tolu@canalstreetkitchen.co.uk' }
};
export const SAMPLE_NOW = new Date(2026, 10, 26, 18, 20);

/* Sample call stories per kind of business. `when` values are minutes before "now". */
function stories(kind, biz, klaro, now) {
  const k = klaro || 'Klaro';
  const greet = 'Hi, thanks for calling ' + biz + '. This is ' + k + ', the virtual receptionist. How can I help?';
  const fri = at(now, ((5 - now.getDay() + 7) % 7) || 7, 19, 0);
  const soon = at(now, now.getDay() === 5 ? 3 : now.getDay() === 6 ? 2 : 1, 9, 30);
  const map = {
    restaurant: {
      team: 'Reservations',
      lead: { customer: 'Alex Morgan', phone: '+44 7700 900 318', topic: 'Table for 8 on ' + DAYS_LONG[fri.getDay()] + ' at 7pm', request: { party: 8, time: slot(fri) },
        summary: 'Alex asked for a table for eight on ' + DAYS_LONG[fri.getDay()] + ' at 7pm. ' + k + ' explained that groups of eight are confirmed by the team and took a callback number.',
        attempted: 'Passed to the team. No table was booked on the call.', next: 'Check availability for ' + slot(fri) + ' and call Alex back.', need: 'Availability needs checking',
        transcript: [[k, greet], ['Alex', 'Hi, I’d like a table for eight this ' + DAYS_LONG[fri.getDay()] + ' at 7pm, please.'], [k, 'Groups of eight are confirmed by our team. Can I take your name and a number to call you back?'], ['Alex', 'Alex Morgan. It’s 07700 900318.'], [k, 'Thanks Alex. I’ll pass that to the team. They’ll confirm availability with you.']] },
      second: { customer: 'Grace Obi', phone: '+44 7700 900 442', topic: 'Private dining for 20 next month', summary: 'Grace asked about private dining for 20 guests next month and whether a deposit is needed.', attempted: 'Shared opening hours. Passed the deposit question to the owner.', next: 'Send the private dining details and deposit terms.', need: 'Deposit question needs a person' },
      faq: { topic: 'Asked about vegan options', q: 'Do you have vegan options?', a: 'Yes, there are vegan options on the menu. I can pass on any specific dietary needs to the team.' },
      past: { customer: 'Ben Carter', phone: '+44 7700 900 127', topic: 'Moved a booking to 20:30', summary: 'Ben asked to move his booking for 4 from 20:00 to 20:30.', attempted: 'Booking system not connected. Change passed to the owner.', outcome: 'Moved to 20:30.', need: 'Booking change needs updating' }
    },
    plumbing: {
      team: 'Engineers',
      lead: { customer: 'Sam Okafor', phone: '+44 7700 900 214', topic: 'Boiler losing pressure, wants a visit', request: { time: slot(soon) },
        summary: 'Sam said the boiler keeps losing pressure and asked for someone to come out. ' + k + ' took the postcode and a callback number.',
        attempted: 'Visit requested. Nothing was booked on the call.', next: 'Confirm a visit time with Sam.', need: 'Visit time needs confirming',
        transcript: [[k, greet], ['Sam', 'Hi, my boiler keeps losing pressure. Can someone come out?'], [k, 'I can pass that to the team. What’s your postcode and the best number to reach you?'], ['Sam', 'M20 2AB, and it’s 07700 900214.'], [k, 'Thanks Sam. The team will call you to confirm a time.']] },
      second: { customer: 'Priya Shah', phone: '+44 7700 900 561', topic: 'Quote for a new bathroom', summary: 'Priya asked for a rough price for a full bathroom refit.', attempted: 'Explained that quotes need a visit. Passed to the owner.', next: 'Call Priya to arrange a quote visit.', need: 'Quote request needs a person' },
      faq: { topic: 'Asked which areas you cover', q: 'Do you cover my area?', a: 'I’ll check the areas on file and pass your postcode to the team if it’s close to the edge.' },
      past: { customer: 'Ade Bakare', phone: '+44 7700 900 733', topic: 'Moved a visit to the afternoon', summary: 'Ade asked to move a morning visit to the afternoon.', attempted: 'Calendar not connected. Change passed to the owner.', outcome: 'Moved to 14:00.', need: 'Visit change needs updating' }
    },
    dental: {
      team: 'Reception',
      lead: { customer: 'Hannah Reid', phone: '+44 7700 900 386', topic: 'New patient check-up', request: { time: slot(soon) },
        summary: 'Hannah asked whether the practice is taking new patients and wants a check-up. ' + k + ' took her details.',
        attempted: 'Appointment requested. Nothing was booked on the call.', next: 'Confirm a check-up time with Hannah.', need: 'Appointment needs confirming',
        transcript: [[k, greet], ['Hannah', 'Hi, are you taking new patients? I’d like a check-up.'], [k, 'I’ll pass that to reception so they can confirm a time. Can I take your name and number?'], ['Hannah', 'Hannah Reid, 07700 900386.'], [k, 'Thanks Hannah. Reception will call you to confirm.']] },
      second: { customer: 'Tom Ellis', phone: '+44 7700 900 652', topic: 'Chipped tooth, wants to be seen', summary: 'Tom chipped a tooth and asked how soon he could be seen.', attempted: 'Flagged as urgent for reception.', next: 'Call Tom about the next urgent slot.', need: 'Urgent appointment request' },
      faq: { topic: 'Asked about parking', q: 'Is there parking nearby?', a: 'I’ll share what’s on file about parking and pass on anything else to reception.' },
      past: { customer: 'Mia Lewis', phone: '+44 7700 900 278', topic: 'Moved a hygiene appointment', summary: 'Mia asked to move her hygiene appointment by a week.', attempted: 'Calendar not connected. Change passed to reception.', outcome: 'Moved to the following week.', need: 'Appointment change needs updating' }
    },
    salon: {
      team: 'Stylists',
      lead: { customer: 'Zainab Bello', phone: '+44 7700 900 419', topic: 'Braids on Saturday morning', request: { time: slot(at(now, ((6 - now.getDay() + 7) % 7) || 7, 10, 0)) },
        summary: 'Zainab asked for knotless braids on Saturday morning. ' + k + ' took her details for the team to confirm.',
        attempted: 'Appointment requested. Nothing was booked on the call.', next: 'Confirm a Saturday slot with Zainab.', need: 'Appointment needs confirming',
        transcript: [[k, greet], ['Zainab', 'Hi, can I book knotless braids for Saturday morning?'], [k, 'I’ll pass that to the team to confirm. Can I take your name and number?'], ['Zainab', 'Zainab Bello, 07700 900419.'], [k, 'Thanks Zainab. The team will confirm your slot.']] },
      second: { customer: 'Ella Hart', phone: '+44 7700 900 593', topic: 'Colour correction price', summary: 'Ella asked how much a colour correction would cost.', attempted: 'Explained it needs a consultation. Passed to the owner.', next: 'Offer Ella a consultation.', need: 'Pricing question needs a person' },
      faq: { topic: 'Asked about deposits', q: 'Do I need to pay a deposit?', a: 'I’ll share the deposit policy on file and the team can confirm anything else.' },
      past: { customer: 'Jade Moss', phone: '+44 7700 900 811', topic: 'Moved an appointment', summary: 'Jade asked to move her appointment to later in the day.', attempted: 'Calendar not connected. Change passed to the owner.', outcome: 'Moved to 15:00.', need: 'Appointment change needs updating' }
    },
    general: {
      team: 'Team',
      lead: { customer: 'Jordan Lee', phone: '+44 7700 900 345', topic: 'Wants to book an appointment', request: { time: slot(soon) },
        summary: 'Jordan asked to book an appointment and left a callback number. ' + k + ' explained the team will confirm a time.',
        attempted: 'Request passed to the team. Nothing was booked on the call.', next: 'Confirm a time with Jordan.', need: 'Appointment needs confirming',
        transcript: [[k, greet], ['Jordan', 'Hi, I’d like to book an appointment, please.'], [k, 'I’ll pass that to the team so they can confirm a time. Can I take your name and number?'], ['Jordan', 'Jordan Lee, 07700 900345.'], [k, 'Thanks Jordan. The team will call you back to confirm.']] },
      second: { customer: 'Chris Walsh', phone: '+44 7700 900 472', topic: 'Asked for a price', summary: 'Chris asked for a price that isn’t on file.', attempted: 'Took details. Passed the question to the owner.', next: 'Call Chris back with a price.', need: 'Pricing question needs a person' },
      faq: { topic: 'Asked about opening hours', q: 'What time are you open today?', a: 'I’ll share the opening hours on file.' },
      past: { customer: 'Sophie King', phone: '+44 7700 900 698', topic: 'Changed an appointment', summary: 'Sophie asked to move her appointment.', attempted: 'Calendar not connected. Change passed to the owner.', outcome: 'Moved to a later time.', need: 'Change needs updating' }
    }
  };
  return map[kind] || map.general;
}

/**
 * Build a workspace.
 * draft: { bizName, klaroName, kind, services, testCall, url, ... }
 * people: { id: { name, role: 'owner'|'member', team, email } }
 */
/* ---------- what Klaro knows ---------- */
let kbSeq = 0;
const kid = (p) => p + Date.now().toString(36) + (kbSeq++).toString(36);
export function knowledgeFrom(draft) {
  const d = draft || {};
  return {
    description: d.bizDesc || '',
    services: (d.services || []).slice(0, 20),
    facts: (d.facts || []).filter((f) => f && f.k && (f.v || '').trim()).map((f) => ({ k: f.k, v: f.v })),
    qa: [],
    updates: [],
    source: d.url ? { url: d.url, readAt: null } : null
  };
}
/** Knowledge for any workspace, including ones made before knowledge existed. */
export const kbOf = (s) => s.knowledge || { description: '', services: s.services || [], facts: [], qa: [], updates: [], source: s.url ? { url: s.url } : null };

const WORD = /[a-z0-9£$]+/g;
const STOP = new Set('a an the is are do does you your we our i me my to of for on in at it and or can could would will be have has with what when where how which there any this that from about please'.split(' '));
const words = (t) => (String(t || '').toLowerCase().match(WORD) || []).filter((w) => !STOP.has(w) && w.length > 1);
/** Preview of how Klaro finds an answer: best match across taught answers, temporary updates and facts. */
export function findAnswer(kb, question, today) {
  const q = words(question);
  if (!q.length) return null;
  const score = (text) => { const w = new Set(words(text)); return q.reduce((n, x) => n + (w.has(x) || [...w].some((y) => y.length > 3 && (y.startsWith(x) || x.startsWith(y))) ? 1 : 0), 0); };
  const live = (kb.updates || []).filter((u) => !u.until || !today || u.until >= today);
  const cands = []
    .concat((kb.qa || []).map((x) => ({ kind: 'Taught answer', src: x.q, answer: x.a, s: score(x.q + ' ' + x.a) * 1.4 })))
    .concat(live.map((u) => ({ kind: 'Current update', src: u.text, answer: u.text, s: score(u.text) * 1.6 })))
    .concat((kb.facts || []).map((f) => ({ kind: 'Fact', src: f.k, answer: f.k + ': ' + f.v + '.', s: score(f.k + ' ' + f.v) })))
    .concat((kb.services || []).map((x) => ({ kind: 'Service', src: x, answer: 'Yes, we offer ' + x.toLowerCase() + '. I can take your details so the team can follow up.', s: score(x) * 0.9 })));
  const best = cands.sort((a, b) => b.s - a.s)[0];
  return best && best.s >= 1 ? best : null;
}

export function initialWorkspace(draft, people, ownerId, nowInput, sample, examples) {
  const now = nowInput ? new Date(nowInput) : SAMPLE_NOW;
  const isSample = sample !== false && !people;
  const P = people || SAMPLE_PEOPLE;
  const owner = ownerId || Object.keys(P).find((id) => P[id].role === 'owner') || Object.keys(P)[0];
  const biz = (draft && draft.bizName) || 'Canal Street Kitchen';
  const klaro = (draft && draft.klaroName) || 'Klaro';
  const kind = (draft && draft.kind) || (isSample ? 'restaurant' : 'general');
  const S = stories(kind, biz, klaro, now);
  const tLead = addMin(now, -10), tFaq = addMin(now, -38), tSecond = addMin(now, -75), tPast = at(now, -1, 16, 30);
  const ownerName = P[owner] ? P[owner].name : 'Owner';
  const L = S.lead;
  const lf = first(L.customer);
  const ws = {
    sample: isSample,
    examples: examples !== false,
    biz, klaro, kind, team: S.team, url: (draft && draft.url) || '',
    services: (draft && draft.services) || [],
    knowledge: knowledgeFrom(draft),
    people: P, owner,
    today: dayLabel(now), todayLong: longLabel(now),
    clock: now.getHours() * 60 + now.getMinutes(),
    savedAt: isSample ? hhmm(addMin(now, -15)) : hhmm(now),
    number: { status: 'none' },
    demoCall: (draft && draft.testCall) || 'none',
    enquiries: [
      {
        id: 'e1', customer: L.customer, phone: L.phone, email: '', ally: { shape: 'circle', tile: 'violet' },
        day: dayLabel(tLead), received: hhmm(tLead), topic: L.topic, request: L.request,
        status: 'awaiting', owner: null, booking: 'awaiting', confirmed: null, delivery: 'none', deliveryLog: [], attempts: 0,
        summary: L.summary, attempted: L.attempted, next: L.next,
        repeat: '1 earlier enquiry · last month · closed',
        transcript: L.transcript, duration: '1 min 12 s', needs: 'n1',
        timeline: [
          { t: hhmm(tLead), by: klaro, text: 'Answered ' + lf + '’s call (1 min 12 s).' },
          { t: hhmm(addMin(tLead, 1)), by: klaro, text: 'Created enquiry: ' + L.topic.charAt(0).toLowerCase() + L.topic.slice(1) + '. Callback ' + L.phone + '.' },
          { t: hhmm(addMin(tLead, 1)), by: klaro, text: 'Told ' + lf + ': “' + L.transcript[L.transcript.length - 1][1] + '”' },
          { t: hhmm(addMin(tLead, 1)), by: klaro, text: 'Added to Needs You: ' + L.need.toLowerCase() + '.' }
        ]
      },
      {
        id: 'e2', customer: S.second.customer, phone: S.second.phone, ally: { shape: 'drip', tile: 'lime' },
        day: dayLabel(tSecond), received: hhmm(tSecond), topic: S.second.topic,
        status: 'open', owner, booking: 'n/a', delivery: 'none', deliveryLog: [], attempts: 0,
        summary: S.second.summary, attempted: S.second.attempted, next: S.second.next, repeat: null, transcript: null, needs: 'n2',
        timeline: [
          { t: hhmm(tSecond), by: klaro, text: 'Answered ' + first(S.second.customer) + '’s call (2 min 40 s).' },
          { t: hhmm(addMin(tSecond, 2)), by: klaro, text: 'Added to Needs You: ' + S.second.need.toLowerCase() + '.' },
          { t: hhmm(addMin(tSecond, 15)), by: ownerName, text: 'Took ownership.' }
        ]
      },
      {
        id: 'e3', customer: 'Unknown caller', phone: 'Number withheld', ally: { shape: 'square', tile: 'lilac' },
        day: dayLabel(tFaq), received: hhmm(tFaq), topic: S.faq.topic,
        status: 'closed', owner: null, booking: 'n/a', delivery: 'none', deliveryLog: [], attempts: 0,
        summary: 'The caller asked: “' + S.faq.q + '” ' + klaro + ' answered from the approved facts.',
        attempted: 'Answered from approved facts.', outcome: 'Answered on the call. No follow-up needed.',
        next: null, repeat: null, transcript: [['Caller', S.faq.q], [klaro, S.faq.a]], needs: null,
        timeline: [{ t: hhmm(tFaq), by: klaro, text: 'Answered from approved facts. Closed automatically.' }]
      },
      {
        id: 'e4', customer: S.past.customer, phone: S.past.phone, ally: { shape: 'drop', tile: 'amber' },
        day: dayLabel(tPast), received: hhmm(tPast), topic: S.past.topic,
        status: 'closed', owner, booking: 'confirmed', confirmed: S.past.outcome, delivery: 'delivered',
        deliveryLog: [{ t: hhmm(addMin(tPast, 25)), ok: true, text: 'Confirmation text delivered.' }], attempts: 0,
        summary: S.past.summary, attempted: S.past.attempted, outcome: S.past.outcome + ' Done by ' + ownerName + '.',
        next: null, repeat: null, transcript: null, needs: 'n3',
        timeline: [
          { t: hhmm(tPast), by: klaro, text: 'Answered ' + first(S.past.customer) + '’s call.' },
          { t: hhmm(addMin(tPast, 22)), by: ownerName, text: S.past.outcome + ' Resolved Needs You.' },
          { t: hhmm(addMin(tPast, 25)), by: 'System', text: 'Confirmation text delivered.' }
        ]
      }
    ],
    needs: [
      { id: 'n1', enquiry: 'e1', reason: L.need, priority: 'High', owner: null, next: L.next, state: 'open', opened: hhmm(addMin(tLead, 1)), resolution: null },
      { id: 'n2', enquiry: 'e2', reason: S.second.need, priority: 'Medium', owner, next: S.second.next, state: 'open', opened: hhmm(addMin(tSecond, 2)), resolution: null },
      { id: 'n3', enquiry: 'e4', reason: S.past.need, priority: 'Low', owner, next: null, state: 'resolved', opened: DAYS[tPast.getDay()] + ' ' + hhmm(addMin(tPast, 1)), resolution: S.past.outcome + ' · ' + ownerName + ' · ' + DAYS[tPast.getDay()] + ' ' + hhmm(addMin(tPast, 22)) }
    ]
  };
  if (examples === false) { ws.enquiries = []; ws.needs = []; }
  return ws;
}

/** Owner actions on the example calls: add them to explore, or clear them. */
export function withExamples(s, on, nowIso) {
  if (!on) return { ...s, examples: false, enquiries: [], needs: [] };
  const fresh = initialWorkspace({ bizName: s.biz, klaroName: s.klaro, kind: s.kind, services: s.services, url: s.url, testCall: s.demoCall }, s.people, s.owner, nowIso || new Date().toISOString(), false, true);
  return { ...s, examples: true, enquiries: fresh.enquiries, needs: fresh.needs, today: fresh.today, todayLong: fresh.todayLong, clock: fresh.clock };
}

const upd = (list, id, fn) => list.map((x) => (x.id === id ? fn(x) : x));
const addTl = (e, t, by, text) => ({ ...e, timeline: e.timeline.concat([{ t, by, text }]) });
const personName = (s, id) => (s.people && s.people[id] ? s.people[id].name : 'Someone');

/** Which actions change the record (owner/admin only). */
export const WRITE_ACTIONS = ['assign', 'attempt', 'confirm', 'send-result', 'told', 'resolve', 'reopen', 'request-number', 'cancel-number', 'kb-set', 'kb-add-qa', 'kb-del-qa', 'kb-add-update', 'kb-del-update', 'kb-source', 'rename-biz', 'set-member-role', 'remove-member', 'allow-member'];
/** Changes anyone signed in can make, to their own profile only. */
export const SELF_ACTIONS = ['update-profile'];

export const telHref = (n) => 'tel:' + String(n || '').replace(/[^\d+]/g, '');
export const numberOf = (s) => (s && s.number && typeof s.number === 'object' ? s.number : { status: 'none' });

export function reducer(s, a) {
  const minsNow = a.now && /^\d\d:\d\d$/.test(a.now) ? parseInt(a.now.slice(0, 2), 10) * 60 + parseInt(a.now.slice(3), 10) : s.clock + (a.mins || 2);
  const now = fmt(minsNow);
  const clock = minsNow;
  const who = personName(s, a.actor);
  switch (a.type) {
    case 'reset': return initialWorkspace(a.draft);
    case 'request-number': {
      const kind = a.kind === 'forward' ? 'forward' : 'new';
      return { ...s, number: { status: 'requested', kind, area: String(a.area || '').slice(0, 60), existing: String(a.existing || '').slice(0, 30), requestedAt: (s.today || '') + ' ' + now, requestedBy: who } };
    }
    case 'cancel-number': return { ...s, number: { status: 'none' } };
    case 'kb-set': {
      const kb = { ...kbOf(s) };
      if (a.field === 'description') kb.description = String(a.value || '').slice(0, 600);
      if (a.field === 'services') kb.services = (Array.isArray(a.value) ? a.value : []).map((x) => String(x).slice(0, 60)).filter(Boolean).slice(0, 20);
      if (a.field === 'facts') kb.facts = (Array.isArray(a.value) ? a.value : []).filter((f) => f && f.k && f.v).map((f) => ({ k: String(f.k).slice(0, 40), v: String(f.v).slice(0, 200) })).slice(0, 30);
      return { ...s, knowledge: kb, services: kb.services };
    }
    case 'kb-source': {
      const kb = { ...kbOf(s), source: { url: String(a.url || '').slice(0, 200), readAt: (s.today || '') + ' ' + now } };
      return { ...s, knowledge: kb };
    }
    case 'kb-add-qa': {
      const kb = kbOf(s);
      const item = { id: kid('q'), q: String(a.q || '').slice(0, 200), a: String(a.a || '').slice(0, 600), by: who, at: (s.today || '') + ' ' + now, from: a.from || null };
      if (!item.q || !item.a) return s;
      let next = { ...s, knowledge: { ...kb, qa: [item].concat(kb.qa || []).slice(0, 200) } };
      if (a.need) {
        const n = next.needs.find((x) => x.id === a.need);
        if (n && n.state !== 'resolved') {
          next.needs = next.needs.map((x) => (x.id === a.need ? { ...x, state: 'resolved', next: null, resolution: 'Taught ' + (s.klaro || 'Klaro') + ' the answer · ' + who + ' · ' + now } : x));
          if (n.enquiry) next.enquiries = next.enquiries.map((e) => (e.id === n.enquiry ? addTl(e, now, who, 'Taught ' + (s.klaro || 'Klaro') + ': “' + item.q + '” → “' + item.a + '”. It will answer this next time.') : e));
        }
      }
      return next;
    }
    case 'kb-del-qa': { const kb = kbOf(s); return { ...s, knowledge: { ...kb, qa: (kb.qa || []).filter((x) => x.id !== a.id) } }; }
    case 'kb-add-update': {
      const kb = kbOf(s);
      const u = { id: kid('u'), text: String(a.text || '').slice(0, 300), until: String(a.until || '').slice(0, 10), by: who, at: (s.today || '') + ' ' + now };
      if (!u.text) return s;
      return { ...s, knowledge: { ...kb, updates: [u].concat(kb.updates || []).slice(0, 50) } };
    }
    case 'kb-del-update': { const kb = kbOf(s); return { ...s, knowledge: { ...kb, updates: (kb.updates || []).filter((x) => x.id !== a.id) } }; }
    case 'rename-biz': { const name = String(a.name || '').trim().slice(0, 80); return name ? { ...s, biz: name } : s; }
    case 'update-profile': {
      const p = s.people[a.actor]; const name = String(a.name || '').trim().slice(0, 60);
      if (!p || !name) return s;
      return { ...s, people: { ...s.people, [a.actor]: { ...p, name, team: a.team != null ? String(a.team).slice(0, 40) : p.team } } };
    }
    case 'set-member-role': {
      const p = s.people[a.id]; if (!p) return s;
      const role = a.role === 'owner' ? 'owner' : 'member';
      const owners = Object.values(s.people).filter((x) => x.role === 'owner' && x.id !== a.id).length;
      if (role === 'member' && owners === 0) return s;
      return { ...s, people: { ...s.people, [a.id]: { ...p, role, team: role === 'owner' ? 'Admin' : (s.team || 'Team') } } };
    }
    case 'allow-member': return { ...s, removed: (s.removed || []).filter((x) => x !== a.id) };
    case 'remove-member': {
      if (!s.people[a.id] || a.id === a.actor) return s;
      const people = { ...s.people }; delete people[a.id];
      return { ...s, people, removed: (s.removed || []).concat([a.id]) };
    }
    case 'replace': return a.state;
    case 'assign': {
      const p = a.owner && s.people[a.owner];
      const name = p ? p.name + (p.team ? ' (' + p.team + ')' : '') : 'nobody';
      const enquiries = upd(s.enquiries, a.id, (e) => addTl({ ...e, owner: a.owner || null }, now, who, 'Assigned to ' + name + '.'));
      const e = enquiries.find((x) => x.id === a.id);
      const needs = e && e.needs ? upd(s.needs, e.needs, (n) => ({ ...n, owner: a.owner || null })) : s.needs;
      return { ...s, clock, enquiries, needs };
    }
    case 'attempt': {
      const spoke = personName(s, a.spokeBy);
      const cur = s.enquiries.find((x) => x.id === a.id);
      const fn = first(cur && cur.customer);
      const enquiries = upd(s.enquiries, a.id, (e) => addTl({ ...e, attempts: e.attempts + 1, next: 'Try ' + fn + ' again later today.' }, now, spoke, 'Called ' + fn + ': no answer. Still awaiting confirmation. Recorded by ' + who + '.'));
      const e = enquiries.find((x) => x.id === a.id);
      const needs = e.needs ? upd(s.needs, e.needs, (n) => ({ ...n, next: 'Try ' + fn + ' again later today (' + e.attempts + ' failed attempt' + (e.attempts > 1 ? 's' : '') + ').' })) : s.needs;
      return { ...s, clock, enquiries, needs };
    }
    case 'confirm': {
      const spoke = personName(s, a.spokeBy);
      const cur = s.enquiries.find((x) => x.id === a.id);
      const fn = first(cur && cur.customer);
      let enquiries = upd(s.enquiries, a.id, (e) => {
        let x = { ...e, status: 'confirmed', booking: 'confirmed', confirmed: a.time, email: a.email || e.email, next: 'Send ' + fn + ' a written confirmation.' };
        x = addTl(x, now, spoke, 'Spoke to ' + fn + ' on the phone. Confirmed for ' + a.time + (a.party ? ', ' + a.party + ' guests' : '') + '.');
        x = addTl(x, now, who, 'Recorded the outcome: confirmed by ' + spoke + ' at ' + now + '.');
        return x;
      });
      const e = enquiries.find((x) => x.id === a.id);
      let needs = s.needs;
      if (e.needs) {
        needs = upd(s.needs, e.needs, (n) => ({ ...n, state: 'resolved', next: null, resolution: 'Confirmed with ' + fn + ' · ' + who + ' · ' + now }));
        enquiries = upd(enquiries, a.id, (x) => addTl(x, now, 'System', 'Left Needs You: confirmed.'));
      }
      return { ...s, clock, enquiries, needs };
    }
    case 'send-result': {
      const enquiries = upd(s.enquiries, a.id, (e) => {
        const fn = first(e.customer);
        const log = e.deliveryLog.concat([{ t: now, ok: a.ok, channel: a.channel, text: a.ok ? (a.channel === 'text' ? 'Confirmation text delivered to ' + e.phone + '.' : 'Confirmation email delivered to ' + e.email + '.') : 'Confirmation email not delivered: email provider unavailable.' }]);
        let x = { ...e, delivery: a.ok ? 'delivered' : 'failed', deliveryLog: log, next: a.ok ? null : 'Retry the confirmation, send it by text, or note that ' + fn + ' was told on the call.', status: a.ok ? 'closed' : e.status };
        x = addTl(x, now, 'System', log[log.length - 1].text);
        return x;
      });
      return { ...s, clock, enquiries };
    }
    case 'told': {
      const enquiries = upd(s.enquiries, a.id, (e) => addTl({ ...e, delivery: 'told', status: 'closed', next: null }, now, who, 'Recorded that ' + first(e.customer) + ' was told the confirmed time on the call. No written confirmation sent.'));
      return { ...s, clock, enquiries };
    }
    case 'resolve': {
      const n = s.needs.find((x) => x.id === a.id);
      if (!n) return s;
      const needs = upd(s.needs, a.id, (x) => ({ ...x, state: 'resolved', next: null, resolution: a.reason + ' · ' + who + ' · ' + now }));
      const enquiries = n.enquiry ? upd(s.enquiries, n.enquiry, (e) => addTl(e, now, who, 'Resolved Needs You: ' + a.reason + '.')) : s.enquiries;
      return { ...s, clock, needs, enquiries };
    }
    case 'reopen': {
      const n = s.needs.find((x) => x.id === a.id);
      if (!n) return s;
      const needs = upd(s.needs, a.id, (x) => ({ ...x, state: 'reopened', next: a.next || 'Check what changed and follow up.' }));
      const enquiries = n.enquiry ? upd(s.enquiries, n.enquiry, (e) => addTl(e, now, who, 'Reopened Needs You.')) : s.enquiries;
      return { ...s, clock, needs, enquiries };
    }
    default: return s;
  }
}

export function counts(s) {
  const openEnq = s.enquiries.filter((e) => e.status === 'awaiting' || e.status === 'open' || e.status === 'confirmed').length;
  const needsOpen = s.needs.filter((n) => n.state === 'open' || n.state === 'reopened').length;
  const actions = s.enquiries.filter((e) => e.booking === 'awaiting' || e.delivery === 'failed' || (e.status === 'confirmed' && e.delivery === 'none')).length;
  const callsToday = s.enquiries.filter((e) => e.day === s.today).length;
  return { openEnq, needsOpen, actions, callsToday };
}
