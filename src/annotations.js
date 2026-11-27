// Per-screen handoff notes, from "Klaro User and Admin Handoff" (26 Nov 2026).
// Each frame answers: who can act, what input is required, what record changes,
// and where the next person sees the result.

export const ANNOTATIONS = {
  '01': {
    title: 'Landing',
    who: 'Visitor (not signed in).',
    input: 'A website address, or “Describe your business instead”.',
    record: 'Opens a draft preview. Nothing is saved yet.',
    next: 'The visitor sees the draft on 02 Klaro Generator.',
    states: [['demo', 'Hero call cards, sample call and dashboard are simulated examples and are labelled where they appear.']]
  },
  '02': {
    title: 'Klaro Generator',
    who: 'Visitor.',
    input: 'Reviews business name, services, hours, greeting and voice. Facts marked Check still need confirming.',
    record: 'Updates the draft. “Let me hear Klaro” uses the reviewed draft.',
    next: 'The draft carries into 03 Live Test Call and is preserved through 04.',
    states: [['demo', 'The scan is simulated in this preview.'], ['failure', 'Scan failure offers retry or manual entry.'], ['recovery', 'Edits and the address are kept on retry.']]
  },
  '03': {
    title: 'Live Test Call',
    who: 'Visitor.',
    input: 'Mobile number with country code and explicit consent before “Call me now”. Browser audio as a fallback.',
    record: 'Adds a demo call and its summary to the draft. Never counted as real activity.',
    next: '“Save my Klaro” opens 04 with the draft and demo summary attached.',
    states: [['demo', 'Every call state here is simulated and labelled. A live build shows ringing, connected, completed, unanswered or failed only on network evidence.'], ['failure', 'Failed and unanswered calls say nothing was dialled or recorded.']]
  },
  '04': {
    title: 'Email and code',
    who: 'Visitor becoming a workspace user.',
    input: 'Email, then a 6-digit code. Resend after 30 seconds. Codes expire after 10 minutes.',
    record: 'Verifies the email, creates or opens the workspace and saves the draft to it.',
    next: 'Opens 05 Command Centre showing the signed-in role (Owner/admin or Member).',
    states: [['demo', 'No email is sent in this preview. The demo code is shown on screen.'], ['failure', 'Wrong code and expired code each have their own message.'], ['recovery', 'Resend issues a fresh code. The draft is never lost.']]
  },
  '05': {
    title: 'Command Centre',
    who: 'Owner/admin sees everything. Members see permitted, read-only views.',
    input: 'None required. Each count or activity row opens its underlying records.',
    record: 'Read only. Counts refresh after a write elsewhere succeeds.',
    next: 'Rows open 07 Calls & Enquiries or 08 Needs You on the same record.',
    states: [['pending', 'Number not active yet: first use shows the next setup step (06).'], ['demo', 'Demo calls are kept separate and never counted.']]
  },
  '06': {
    title: 'Number and Go Live',
    who: 'Authorised operator only (verified number permission).',
    input: 'New number or forwarding, plus any payment, verification and routing prerequisites.',
    record: 'Number moves through requested, configuring, failed or live.',
    next: 'Status shows on 05. Klarnow pilot ops see failure reason, last attempt and retest internally.',
    states: [['pending', 'A successful payment alone does not prove calls can reach Klaro.']]
  },
  '07': {
    title: 'Calls and Enquiries',
    who: 'Owner/admin can assign and record follow-up. Members read only, even when assigned.',
    input: 'Assignee, call attempt outcome, confirmed time, who spoke to the caller and when.',
    record: 'Enquiry status, owner and timeline. Booking and message delivery are separate statuses.',
    next: 'The timeline, Needs You and the Command Centre count update after the write succeeds.',
    states: [['pending', '“Awaiting confirmation” until a person confirms.'], ['failure', 'A failed confirmation email stays visible with the last attempt.'], ['recovery', 'Retry, send by text, or record that Alex was told on the call.']]
  },
  '08': {
    title: 'Needs You',
    who: 'Owner/admin assigns, resolves with a reason, or reopens. Members read only.',
    input: 'Assignee, or a resolution reason.',
    record: 'Item moves between open, resolved and reopened. The linked enquiry timeline gets an entry.',
    next: 'Enquiry timeline and Command Centre count refresh after the write succeeds.',
    states: [['pending', 'A failed contact attempt keeps the item open with a next action.'], ['failure', 'A failed save shows an error and changes nothing.']]
  },
  '09': {
    title: 'Klaro Studio',
    who: 'Owner/admin.',
    input: 'Business knowledge, greeting, voice, call handling and supported actions, in tabs.',
    record: 'Draft, saved and test states. Disconnected tools are marked unavailable.',
    next: 'Klaro uses the saved version on the next call.',
    states: [['failure', 'A failed save stays visible with a retry.']]
  }
};

export const PERMISSION_FLAGS = [
  'Should an assigned member be able to record the outcome? The current API reserves enquiry writes for owner/admin.',
  'Should members see number status? Shown read-only here; controls stay owner/admin.'
];
