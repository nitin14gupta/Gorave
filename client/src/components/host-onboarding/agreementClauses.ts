// The host agreement every host signs. Shown in onboarding step 4 and the
// catch-up agreement screen. `short` and `line` are the friendly version shown
// first; `title` and `body` are the full wording, one tap away ("Read the full
// agreement"), and that's what's signed.
export const AGREEMENT_CLAUSES: { short: string; line: string; icon: 'shield' | 'ban' | 'flag' | 'scale' | 'party'; title: string; body: string }[] = [
  {
    short: 'You run the night',
    line: 'Keep your guests safe, and step in if something feels off.',
    icon: 'shield',
    title: 'You set the tone for your event',
    body: "As a host, you're responsible for the safety and conduct of everyone at your event, not just your own. Screen your guest list where you can, and step in if something feels wrong.",
  },
  {
    short: 'Zero tolerance for harassment',
    line: 'From you, or from anyone at your night.',
    icon: 'ban',
    title: 'Zero tolerance for harassment',
    body: 'Confirmed harassment at an event you host, by you or by a guest you failed to act on, can result in your host privileges being revoked and your account suspended.',
  },
  {
    short: 'Reports are for real problems',
    line: 'Never to settle a personal score.',
    icon: 'flag',
    title: 'False reports are a violation too',
    body: "Using a harassment report to settle a personal dispute, or knowingly filing one that's false, is also a violation and can result in account action.",
  },
  {
    short: 'Play by local rules',
    line: 'Age, capacity, noise, alcohol: you know your place best.',
    icon: 'scale',
    title: 'Follow local laws',
    body: "Age limits, capacity, noise rules, alcohol and venue rules: you're responsible for knowing and following what applies to your event.",
  },
  {
    short: "It's your party",
    line: 'Gorave brings the people. You run the night.',
    icon: 'party',
    title: "It's on you, not just Gorave",
    body: "Gorave connects you with attendees; it doesn't supervise your event in person. You're the one running it.",
  },
]
