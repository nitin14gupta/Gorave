import { PHOTOS } from '@/constants'

// The two people building Gorave, and how it started. Everything here is in
// the founders' own words (Nitin, 19 Oct 2026). Kaveesha's own details are
// still to come: her page uses only what we know so far. PHOTOS: Unsplash
// placeholders until the founders' own ~25 photos arrive; swap the GALLERY
// and STORY images below, nothing else needs to change.

export interface FounderLink {
  label: string
  href: string
}

export interface Founder {
  key: string
  slug: string
  name: string
  first: string
  role: string
  /** The serif half of the "Nitin builds it." line */
  verb: string
  owns: string[]
  note: string
  photo: string
  /** object-position so the face sits in the frame */
  pos: string
  side: -1 | 1
  /** In their own words */
  quote: string
  /** Short tags under the name */
  tags: string[]
  /** Their page: a few short paragraphs */
  story: string[]
  /** Small human things, from what they told us */
  facts: { k: string; v: string }[]
  links: FounderLink[]
  /** Set until the founder sends their own details */
  pending?: boolean
}

export const TEAM: Founder[] = [
  {
    key: 'nitin',
    slug: 'nitin-gupta',
    name: 'Nitin Gupta',
    first: 'Nitin',
    role: 'Founder',
    verb: 'builds it.',
    owns: ['Product', 'Engineering', 'The app'],
    note: 'Every invite, ticket, payout and door scan runs on code he writes.',
    photo: '/img/team/nitin.jpg',
    pos: '50% 30%',
    side: -1,
    quote: 'Building this for the divas and for Gen Z. Clock it. 💅',
    tags: ['Student', 'Extrovert', 'Builds the app'],
    story: [
      'Nitin is a student who builds things. Gorave started with something simple: an empty apartment. He had one, and he figured thousands of people do too. Why not throw a party on the weekend, socialise and make new friends, and earn a little while doing it?',
      'Then he went to a party where nobody was talking. Not because it was a bad crowd, just shyness. A room full of people who wanted to meet each other and didn’t know how to start. That was the gap.',
      'Today he builds Gorave every day: the features, the app, the thing you tap to find a night. And he has fun doing it.',
    ],
    facts: [
      { k: 'Day job', v: 'Building the features, every day' },
      { k: 'At a party', v: 'The extrovert who noticed nobody was talking' },
      { k: 'Screens calls', v: 'Ignored Kaveesha twice because the caller ID said “Baburao”' },
      { k: 'Built for', v: 'The divas and Gen Z 💅' },
    ],
    links: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/nitinCMgupta' },
      { label: 'Instagram', href: 'https://www.instagram.com/nitin.shh_/' },
      { label: 'X', href: 'https://x.com/CMNitingupta' },
      { label: 'Portfolio', href: 'https://nitin.uilora.com/' },
    ],
  },
  {
    key: 'kaveesha',
    slug: 'kaveesha-jeswani',
    name: 'Kaveesha Jeswani',
    first: 'Kaveesha',
    role: 'Co-founder · Head of marketing',
    verb: 'makes it loved.',
    owns: ['Marketing', 'Brand', 'Everything creative'],
    note: 'The look, the words, and how your city finds out about Gorave.',
    photo: '/img/team/kaveesha.jpeg',
    pos: '42% 28%',
    side: 1,
    quote: 'She believed in it from the first call.',
    tags: ['Co-founder', 'Marketing', 'Everything creative'],
    story: [
      'Kaveesha runs marketing and everything creative at Gorave: the brand, the words, and how a city finds out a party is happening down the road.',
      'She came in through a mutual friend, believed in the idea early, and has been building it ever since. Chill, fun and a lovely person to hang out with, which is roughly what you want in someone whose job is getting people to a party.',
    ],
    facts: [
      { k: 'Owns', v: 'Marketing, brand and everything creative' },
      { k: 'First call', v: 'Went unanswered, thanks to a caller ID that said “Baburao”' },
      { k: 'Vibe', v: 'Chill, fun, great to hang out with' },
    ],
    links: [{ label: 'Instagram', href: 'https://www.instagram.com/kaveeshaa420/' }],
    pending: true,
  },
]

export const founderHref = (f: Pick<Founder, 'slug'>) => `/founders/${f.slug}`
export const getFounder = (slug: string) => TEAM.find(f => f.slug === slug)

/** How it started, in order. */
export const JOURNEY: { n: string; when: string; title: string; body: string; image: string; tone?: 'call' }[] = [
  {
    n: '01',
    when: 'The idea',
    title: 'One empty apartment.',
    body: 'Nitin had an apartment sitting empty. Thousands of people do. Why not open it up on weekends, throw a party, make new friends and earn a little?',
    image: PHOTOS.sceneLiving,
  },
  {
    n: '02',
    when: 'The problem',
    title: 'A party where nobody talked.',
    body: 'At a party, nobody was talking. Not a bad crowd, just shy. Everyone wanted to meet someone; nobody knew how to start. Going out needed a better way in.',
    image: PHOTOS.party3,
  },
  {
    n: '03',
    when: 'The call',
    title: 'Caller ID said “Baburao”.',
    body: 'A mutual friend, Zaid, connected them. Kaveesha called. The caller ID said “Baburao”, so Nitin didn’t pick up. Twice. On the third try he called back, and found someone amazing, chill and completely sure about the idea.',
    image: PHOTOS.fr1,
    tone: 'call',
  },
  {
    n: '04',
    when: 'Building',
    title: 'One builds it, one makes it loved.',
    body: 'Nitin builds the app and the features, every day. Kaveesha takes the brand, the words and everything creative. Two people, one fun thing.',
    image: PHOTOS.game1,
  },
  {
    n: '05',
    when: 'The plan',
    title: 'Launch, then 200 nights.',
    body: 'The plan was to launch in October and see 200 events in the first three months. The date is moving a little, the goal isn’t.',
    image: PHOTOS.roof2,
  },
  {
    n: '06',
    when: 'Next',
    title: 'Mumbai first. App soon.',
    body: 'Marketing starts in Mumbai and the app is coming soon. Every kind of night is welcome, but the house party is the vibe.',
    image: PHOTOS.party1,
  },
]

/** The why, in their words. */
export const WHY = 'We see Gorave as a place where two people meet. That gives us the relief of having done something good, and we want to build a company that does well while it does good.'

/** Placeholder photo strip until the real ~25 arrive. */
export const GALLERY: string[] = [PHOTOS.party2, PHOTOS.roof1, PHOTOS.fr2, PHOTOS.dine3, PHOTOS.gig2, PHOTOS.drinks, PHOTOS.roof4, PHOTOS.game1, PHOTOS.party1, PHOTOS.fest]
