// The two people building Gorave. Used by the About team section and its JSON-LD.

export interface Founder {
  key: string
  name: string
  role: string
  /** The serif half of the "Nitin builds it." line */
  verb: string
  owns: string[]
  note: string
  photo: string
  /** object-position so the face sits in the frame */
  pos: string
  side: -1 | 1
}

export const TEAM: Founder[] = [
  {
    key: 'nitin',
    name: 'Nitin Gupta',
    role: 'Founder',
    verb: 'builds it.',
    owns: ['Product', 'Engineering', 'The app'],
    note: 'Every invite, ticket, payout and door scan runs on code he writes.',
    photo: '/img/team/nitin.jpg',
    pos: '50% 30%',
    side: -1,
  },
  {
    key: 'kaveesha',
    name: 'Kaveesha Jeswani',
    role: 'Co-founder · Head of marketing',
    verb: 'makes it loved.',
    owns: ['Marketing', 'Brand', 'Everything creative'],
    note: 'The look, the words, and how your city finds out about Gorave.',
    photo: '/img/team/kaveesha.jpeg',
    pos: '42% 28%',
    side: 1,
  },
]
