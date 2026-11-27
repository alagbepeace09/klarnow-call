// Sample content used by the preview flow. In the product these come from the real
// website scan and the real call. Nothing here is presented as a live result.

export const PRESETS = {
  plumbing: {
    label: 'Trades & home services',
    desc: 'Local plumbing and heating engineers. Boiler repairs and servicing, leaks and emergency call-outs.',
    services: ['Boiler repair', 'Boiler servicing', 'Emergency call-outs', 'Bathroom fitting'],
    facts: [
      ['Opening hours', 'Mon–Fri 8:00–18:00, Sat 9:00–13:00', false],
      ['Areas covered', 'Manchester, Stockport, Trafford', false],
      ['Call-out fee', 'From £65 + VAT', true],
      ['Emergencies', '24/7 for no heating or active leaks', true]
    ],
    sum: {
      customer: 'Sam Okafor',
      enquiry: 'Boiler losing pressure, wants a visit this week',
      details: ['Postcode M20 2AB', 'Prefers Thursday morning', 'Not urgent: heating still on'],
      action: 'Offered Thursday 9:30, the earliest slot in your hours',
      outcome: 'Visit requested. Waiting for you to confirm. Customer told to expect a text.',
      follow: 'Confirm or move Thursday 9:30. The customer is expecting a text from you.'
    }
  },
  dental: {
    label: 'Health & clinics',
    desc: 'Friendly private dental practice offering check-ups, hygiene and cosmetic treatments.',
    services: ['Check-ups', 'Hygienist', 'Teeth whitening', 'Emergency appointments'],
    facts: [
      ['Opening hours', 'Mon–Fri 8:30–17:30', false],
      ['Location', '12 High Street, free parking behind', false],
      ['New patients', 'Welcome, private only', true],
      ['Emergency fee', 'From £85', true]
    ],
    sum: {
      customer: 'Amara Bello',
      enquiry: 'Chipped tooth, wants an appointment soon',
      details: ['New patient', 'Some sensitivity', 'Free after 3pm'],
      action: 'Offered tomorrow 15:40 emergency slot',
      outcome: 'Appointment requested. Waiting for you to confirm.',
      follow: 'Confirm tomorrow 15:40 and send the new-patient form.'
    }
  },
  salon: {
    label: 'Hair & beauty',
    desc: 'Hair and beauty salon for cuts, colour, braids and occasion styling.',
    services: ['Cut & finish', 'Colour', 'Braids', 'Bridal styling'],
    facts: [
      ['Opening hours', 'Tue–Sat 9:00–19:00', false],
      ['Location', 'Unit 4, Market Arcade', false],
      ['Deposits', '£20 for colour and braids', true],
      ['Patch tests', 'Needed 48 hours before colour', false]
    ],
    sum: {
      customer: 'Tolu Adeyemi',
      enquiry: 'Knotless braids for Saturday',
      details: ['Mid-back length', 'First visit', 'Flexible on time'],
      action: 'Offered Saturday 10:00 and shared the deposit policy',
      outcome: 'Booking requested. Deposit link not sent yet.',
      follow: 'Confirm Saturday 10:00 and send the £20 deposit link.'
    }
  },
  general: {
    label: 'Something else',
    desc: '',
    services: ['General enquiries', 'Appointments', 'Prices and quotes'],
    facts: [
      ['Opening hours', 'Mon–Fri 09:00–17:30', true],
      ['Address', 'Your address', true],
      ['Phone', 'Your main number', true]
    ],
    sum: {
      customer: 'Jordan Lee',
      enquiry: 'Wants to book an appointment',
      details: ['New customer', 'Prefers mornings', 'Callback +44 7700 900 345'],
      action: 'Passed to the team. Nothing was booked on the call.',
      outcome: 'Awaiting confirmation. Jordan was told the team will call back.',
      follow: 'Call Jordan to confirm a time.'
    }
  },
  restaurant: {
    label: 'Food & hospitality',
    desc: 'Neighbourhood restaurant on Canal Street serving seasonal plates, with group tables and private dining.',
    services: ['Table bookings', 'Group bookings', 'Private dining', 'Allergy questions'],
    facts: [
      ['Opening hours', 'Tue–Sun 12:00–22:30', false],
      ['Address', '48 Canal Street, Manchester', false],
      ['Groups of 8+', 'Confirmed by the reservations team', true],
      ['Dietary', 'Vegan and gluten-free options', false]
    ],
    sum: {
      customer: 'Alex Morgan',
      enquiry: 'Table for 8 on Friday at 7pm',
      details: ['Party of 8', 'Friday 28 Nov, 19:00', 'Callback +44 7700 900 318'],
      action: 'Passed to the reservations team. No table was booked on the call.',
      outcome: 'Awaiting confirmation. Alex was told the team will confirm availability.',
      follow: 'Check availability for Friday 19:00 and call Alex back.'
    }
  }
};

export function kindFrom(url) {
  const u = (url || '').toLowerCase();
  if (/dent|smile|teeth|ortho/.test(u)) return 'dental';
  if (/salon|hair|beauty|braid|barber|nail/.test(u)) return 'salon';
  if (/plumb|heating|boiler|electric|build|trade/.test(u)) return 'plumbing';
  return 'restaurant';
}

export function cleanUrl(url) {
  return (url || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
}

export function validUrl(u) {
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(cleanUrl(u));
}

export function nameFrom(url) {
  const s = cleanUrl(url).toLowerCase().split(/[/?#]/)[0];
  let base = s.split('.')[0] || '';
  if (!base) return '';
  const words = ['street', 'plumbing', 'heating', 'dental', 'clinic', 'salon', 'hair', 'beauty', 'kitchen', 'cafe', 'restaurant', 'studio', 'solicitors', 'services', 'group', 'braids', 'barbers', 'smiles'];
  base = base.replace(/[-_]+/g, ' ');
  words.forEach((w) => { base = base.replace(new RegExp('([a-z])(' + w + ')', 'g'), '$1 $2'); });
  return base.split(' ').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function greetingFor(name, kname) {
  return 'Hi, thanks for calling ' + (name || 'us') + '. This is ' + (kname || 'Klaro') + ', the virtual receptionist. I can answer questions and take your details for the team. How can I help?';
}

// Example call used in setup. Built from the visitor's own business details.
export function sampleScript(bizName, klaroName, greeting, kind, services, facts) {
  const n = bizName || 'your business';
  const k = kind || 'general';
  const kn = klaroName || 'Klaro';
  const fact = (key) => { const f = (facts || []).find((x) => x && x.k === key && (x.v || '').trim()); return f ? f.v.trim() : ''; };
  const hours = fact('Opening hours');
  const svc = (services || []).find(Boolean);
  if (k === 'restaurant' && !svc) {
    return [
      { who: 'k', text: greeting || greetingFor(n, kn) },
      { who: 'c', text: 'Hi, I’d like a table for eight this Friday at 7pm, please.' },
      { who: 'k', text: 'Groups of eight are confirmed by our team. Can I take your name and a number to call you back?' },
      { who: 'c', text: 'Alex Morgan. It’s 07700 900318.' },
      { who: 'k', text: 'Thanks Alex. I’ll pass that to the team at ' + n + '. They’ll confirm availability with you.' }
    ];
  }
  const caller = k === 'restaurant' ? 'Alex' : k === 'plumbing' ? 'Sam' : k === 'dental' ? 'Hannah' : k === 'salon' ? 'Zainab' : 'Jordan';
  const topic = svc ? svc.charAt(0).toLowerCase() + svc.slice(1) : 'booking an appointment';
  return [
    { who: 'k', text: greeting || greetingFor(n, kn) },
    { who: 'c', text: 'Hi, I’m calling about ' + topic + '. Can someone help me this week?' },
    { who: 'k', text: (hours ? 'Of course. We’re open ' + hours + '. ' : 'Of course. ') + 'I can’t confirm a time myself, but I’ll pass this straight to the team. Can I take your name and the best number to reach you?' },
    { who: 'c', text: 'It’s ' + caller + ', on 07700 900345.' },
    { who: 'k', text: 'Thanks ' + caller + '. I’ve passed that to the team at ' + n + '. They’ll call you back to confirm.' }
  ];
}

/** The summary Klaro would write for the example call above. */
export function sampleSummary(bizName, kind, services) {
  const svc = (services || []).find(Boolean);
  if (kind === 'restaurant' && !svc) return { ...PRESETS.restaurant.sum, customer: 'Alex Morgan (example caller)' };
  const caller = kind === 'restaurant' ? 'Alex' : kind === 'plumbing' ? 'Sam' : kind === 'dental' ? 'Hannah' : kind === 'salon' ? 'Zainab' : 'Jordan';
  const topic = svc || 'Booking an appointment';
  return {
    customer: caller + ' (example caller)',
    enquiry: 'Asked about ' + topic.charAt(0).toLowerCase() + topic.slice(1),
    details: ['Wants help this week', 'Callback 07700 900345'],
    action: 'Passed to the team at ' + (bizName || 'your business') + '. Nothing was booked on the call.',
    outcome: caller + ' was told the team will call back to confirm.',
    follow: 'Call ' + caller + ' back to confirm a time.'
  };
}

export const TRIES = {
  restaurant: ['"Table for 8 on Friday at 7?"', '"Do you have vegan options?"', '"Can we bring a birthday cake?"'],
  plumbing: ['"Can someone come Thursday morning?"', '"How much is a call-out?"', '"It\u2019s urgent, there\u2019s water everywhere."'],
  dental: ['"Can I book a check-up?"', '"Are you taking new patients?"', '"I\u2019ve chipped a tooth."'],
  general: ['"Can I book an appointment?"', '"How much does it cost?"', '"What time are you open?"'],
  salon: ['"Can I book braids for Saturday?"', '"Do you need a deposit?"', '"How long does colour take?"']
};

export function speak(text, voice, onEnd) {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    u.rate = voice === 'calm' ? 0.92 : voice === 'bright' ? 1.08 : 1;
    u.pitch = voice === 'bright' ? 1.15 : voice === 'calm' ? 0.9 : 1;
    if (onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
    return true;
  } catch (e) {
    return false;
  }
}

export function stopSpeech() {
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
}
