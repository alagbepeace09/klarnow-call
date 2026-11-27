// Workspace data for the prototype: one restaurant, one shared enquiry (Alex's table for 8),
// the same people and timestamps on every screen and role. All simulated.

export const PEOPLE = {
  dami: { id: 'dami', name: 'Dami Ade', role: 'Owner/admin', team: 'Owner', email: 'dami@canalstreetkitchen.co.uk' },
  tolu: { id: 'tolu', name: 'Tolu Bello', role: 'Member', team: 'Reservations', email: 'tolu@canalstreetkitchen.co.uk' }
};

export const fmt = (mins) => String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');

const ALEX_TRANSCRIPT = [
  ['Klaro', 'Hi, thanks for calling Canal Street Kitchen. This is Klaro, the virtual receptionist. How can I help?'],
  ['Alex', 'Hi, I’d like a table for eight this Friday at 7pm, please.'],
  ['Klaro', 'Groups of eight are confirmed by our reservations team. Can I take your name and a number to call you back?'],
  ['Alex', 'Alex Morgan. It’s 07700 900318.'],
  ['Klaro', 'Thanks Alex. I’ll pass that to the reservations team. They’ll confirm availability with you.']
];

export function initialWorkspace(draft) {
  const biz = (draft && draft.bizName) || 'Canal Street Kitchen';
  const klaro = (draft && draft.klaroName) || 'Klaro';
  return {
    biz, klaro,
    clock: 18 * 60 + 20, // simulated "now": 18:20 on Wed 26 Nov
    number: 'none', // none | requested | configuring | failed | live
    demoCall: (draft && draft.testCall) || 'completed',
    enquiries: [
      {
        id: 'e1', customer: 'Alex Morgan', phone: '+44 7700 900 318', email: '', ally: { shape: 'circle', tile: 'violet' },
        day: 'Wed 26 Nov', received: '18:10', topic: 'Table for 8 on Friday at 7pm',
        request: { party: 8, time: 'Fri 28 Nov, 19:00' },
        status: 'awaiting', owner: null, booking: 'awaiting', confirmed: null, delivery: 'none', deliveryLog: [], attempts: 0,
        summary: 'Alex asked for a table for eight on Friday at 7pm. Klaro explained that groups of eight are confirmed by reservations and took a callback number.',
        attempted: 'Passed to the reservations team. No table was booked on the call.',
        next: 'Check availability for Friday 19:00 and call Alex back.',
        repeat: '1 earlier enquiry · 12 Oct · asked about private dining · closed',
        transcript: ALEX_TRANSCRIPT, duration: '1 min 12 s', needs: 'n1',
        timeline: [
          { t: '18:10', by: 'Klaro', text: 'Answered Alex’s call (1 min 12 s).' },
          { t: '18:11', by: 'Klaro', text: 'Created enquiry: table for 8, Fri 28 Nov 19:00. Callback +44 7700 900 318.' },
          { t: '18:11', by: 'Klaro', text: 'Told Alex: “I’ll pass that to the reservations team. They’ll confirm availability with you.”' },
          { t: '18:11', by: 'Klaro', text: 'Added to Needs You: availability needs checking.' }
        ]
      },
      {
        id: 'e2', customer: 'Grace Obi', phone: '+44 7700 900 442', ally: { shape: 'drip', tile: 'lime' },
        day: 'Wed 26 Nov', received: '17:05', topic: 'Private dining for 20 in December',
        status: 'open', owner: 'dami', booking: 'n/a', delivery: 'none', deliveryLog: [], attempts: 0,
        summary: 'Grace asked about private dining for 20 guests on a Saturday in December and whether a deposit is needed.',
        attempted: 'Shared opening hours. Passed the deposit question to the owner.',
        next: 'Send the private dining menu and deposit terms.',
        repeat: null, transcript: null, needs: 'n2',
        timeline: [
          { t: '17:05', by: 'Klaro', text: 'Answered Grace’s call (2 min 40 s).' },
          { t: '17:07', by: 'Klaro', text: 'Added to Needs You: deposit question needs a person.' },
          { t: '17:20', by: 'Dami Ade', text: 'Took ownership.' }
        ]
      },
      {
        id: 'e3', customer: 'Unknown caller', phone: 'Number withheld', ally: { shape: 'square', tile: 'lilac' },
        day: 'Wed 26 Nov', received: '17:42', topic: 'Asked about vegan options',
        status: 'closed', owner: null, booking: 'n/a', delivery: 'none', deliveryLog: [], attempts: 0,
        summary: 'The caller asked whether there are vegan options. Klaro answered from the approved facts.',
        attempted: 'Answered from approved facts.', outcome: 'Answered on the call. No follow-up needed.',
        next: null, repeat: null, transcript: [['Caller', 'Do you have vegan options?'], ['Klaro', 'Yes, we have several vegan and gluten-free dishes on the menu.']], needs: null,
        timeline: [{ t: '17:42', by: 'Klaro', text: 'Answered from approved facts. Closed automatically.' }]
      },
      {
        id: 'e4', customer: 'Ben Carter', phone: '+44 7700 900 127', ally: { shape: 'drop', tile: 'amber' },
        day: 'Tue 25 Nov', received: '16:30', topic: 'Move Thursday booking to 20:30',
        status: 'closed', owner: 'dami', booking: 'confirmed', confirmed: 'Thu 27 Nov, 20:30', delivery: 'delivered', deliveryLog: [{ t: '16:55', ok: true, text: 'Confirmation text delivered.' }], attempts: 0,
        summary: 'Ben asked to move his Thursday booking for 4 from 20:00 to 20:30.',
        attempted: 'Booking system not connected. Change passed to the owner.', outcome: 'Moved to 20:30 by Dami.',
        next: null, repeat: null, transcript: null, needs: 'n3',
        timeline: [
          { t: '16:30', by: 'Klaro', text: 'Answered Ben’s call.' },
          { t: '16:52', by: 'Dami Ade', text: 'Moved the booking to 20:30 and resolved Needs You.' },
          { t: '16:55', by: 'System', text: 'Confirmation text delivered.' }
        ]
      }
    ],
    needs: [
      { id: 'n1', enquiry: 'e1', reason: 'Availability needs checking', priority: 'High', owner: null, next: 'Check Friday 19:00 for 8 and call Alex back.', state: 'open', opened: '18:11', resolution: null },
      { id: 'n2', enquiry: 'e2', reason: 'Deposit question needs a person', priority: 'Medium', owner: 'dami', next: 'Reply with the deposit terms.', state: 'open', opened: '17:07', resolution: null },
      { id: 'n3', enquiry: 'e4', reason: 'Booking change needs the booking book updated', priority: 'Low', owner: 'dami', next: null, state: 'resolved', opened: 'Tue 16:31', resolution: 'Moved to 20:30 in the booking book · Dami Ade · Tue 16:52' }
    ]
  };
}

const upd = (list, id, fn) => list.map((x) => (x.id === id ? fn(x) : x));
const addTl = (e, t, by, text) => ({ ...e, timeline: e.timeline.concat([{ t, by, text }]) });

export function reducer(s, a) {
  const now = fmt(s.clock + (a.mins || 2));
  const clock = s.clock + (a.mins || 2);
  const who = PEOPLE[a.actor] ? PEOPLE[a.actor].name : 'Dami Ade';
  switch (a.type) {
    case 'reset': return initialWorkspace(a.draft);
    case 'assign': {
      const name = a.owner ? PEOPLE[a.owner].name + ' (' + PEOPLE[a.owner].team + ')' : 'nobody';
      const enquiries = upd(s.enquiries, a.id, (e) => addTl({ ...e, owner: a.owner }, now, who, 'Assigned to ' + name + '.'));
      const e = enquiries.find((x) => x.id === a.id);
      const needs = e.needs ? upd(s.needs, e.needs, (n) => ({ ...n, owner: a.owner })) : s.needs;
      return { ...s, clock, enquiries, needs };
    }
    case 'attempt': { // failed contact attempt: stays open with a next action
      const spoke = PEOPLE[a.spokeBy].name;
      const enquiries = upd(s.enquiries, a.id, (e) => addTl({ ...e, attempts: e.attempts + 1, next: 'Try Alex again after 19:00.' }, now, spoke, 'Called Alex: no answer. Still awaiting confirmation. Recorded by ' + who + '.'));
      const e = enquiries.find((x) => x.id === a.id);
      const needs = e.needs ? upd(s.needs, e.needs, (n) => ({ ...n, next: 'Try Alex again after 19:00 (' + e.attempts + ' failed attempt' + (e.attempts > 1 ? 's' : '') + ').' })) : s.needs;
      return { ...s, clock, enquiries, needs };
    }
    case 'confirm': { // owner/admin records the outcome after speaking to Alex
      const spoke = PEOPLE[a.spokeBy].name;
      let enquiries = upd(s.enquiries, a.id, (e) => {
        let x = { ...e, status: 'confirmed', booking: 'confirmed', confirmed: a.time, email: a.email || e.email, next: 'Send Alex a written confirmation.' };
        x = addTl(x, now, spoke, 'Spoke to Alex on the phone. Booking confirmed for ' + a.time + ', ' + a.party + ' guests.');
        x = addTl(x, now, who, 'Recorded the outcome: confirmed by ' + spoke + ' at ' + now + '.');
        return x;
      });
      const e = enquiries.find((x) => x.id === a.id);
      let needs = s.needs;
      if (e.needs) {
        needs = upd(s.needs, e.needs, (n) => ({ ...n, state: 'resolved', next: null, resolution: 'Booking confirmed with Alex · ' + who + ' · ' + now }));
        enquiries = upd(enquiries, a.id, (x) => addTl(x, now, 'System', 'Left Needs You: booking confirmed.'));
      }
      return { ...s, clock, enquiries, needs };
    }
    case 'send-start':
      return { ...s, enquiries: upd(s.enquiries, a.id, (e) => ({ ...e, delivery: 'sending' })) };
    case 'send-result': {
      const enquiries = upd(s.enquiries, a.id, (e) => {
        const log = e.deliveryLog.concat([{ t: now, ok: a.ok, channel: a.channel, text: a.ok ? (a.channel === 'text' ? 'Confirmation text delivered to ' + e.phone + '.' : 'Confirmation email delivered to ' + e.email + '.') : 'Confirmation email not delivered: email provider unavailable.' }]);
        let x = { ...e, delivery: a.ok ? 'delivered' : 'failed', deliveryLog: log, next: a.ok ? null : 'Retry the confirmation, send it by text, or note that Alex was told on the call.', status: a.ok ? 'closed' : e.status };
        x = addTl(x, now, 'System', log[log.length - 1].text);
        return x;
      });
      return { ...s, clock, enquiries };
    }
    case 'told': {
      const enquiries = upd(s.enquiries, a.id, (e) => addTl({ ...e, delivery: 'told', status: 'closed', next: null }, now, who, 'Recorded that Alex was told the confirmed time on the call. No written confirmation sent.'));
      return { ...s, clock, enquiries };
    }
    case 'resolve': {
      const n = s.needs.find((x) => x.id === a.id);
      const needs = upd(s.needs, a.id, (x) => ({ ...x, state: 'resolved', next: null, resolution: a.reason + ' · ' + who + ' · ' + now }));
      const enquiries = n.enquiry ? upd(s.enquiries, n.enquiry, (e) => addTl(e, now, who, 'Resolved Needs You: ' + a.reason + '.')) : s.enquiries;
      return { ...s, clock, needs, enquiries };
    }
    case 'reopen': {
      const n = s.needs.find((x) => x.id === a.id);
      const needs = upd(s.needs, a.id, (x) => ({ ...x, state: 'reopened', next: a.next || 'Check what changed and follow up.', resolution: x.resolution }));
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
  const callsToday = s.enquiries.filter((e) => e.day === 'Wed 26 Nov').length;
  return { openEnq, needsOpen, actions, callsToday };
}
