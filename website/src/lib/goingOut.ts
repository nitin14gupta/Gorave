import type { PhotoKey } from '@/constants'
import type { Crumb } from './seo'
import { slugify } from './seo'
import { GOING_OUT_A } from './guides/goingOutA'
import { GOING_OUT_B } from './guides/goingOutB'
import { WOMEN_GUIDES } from './guides/women'

// Going-out guides (/guides/[slug]) and women's guides (/guides/women/[slug]).
// Plain data, so client sections can take it straight from a server
// component. Product facts must match the app (see the hosting guides).

export type Collection = 'going-out' | 'women'

export const OUT_CATEGORIES = ['First time', 'The night', 'People', 'Plans'] as const
export const WOMEN_CATEGORIES = ['Solo', 'Safety', 'Women-only', 'Hosting'] as const
export type OutCategory = (typeof OUT_CATEGORIES)[number] | (typeof WOMEN_CATEGORIES)[number]

export interface OutSection {
  heading: string
  paragraphs: string[]
  tips?: string[]
}

export interface OutGuideDraft {
  slug: string
  title: string
  /** One-line standfirst under the title */
  dek: string
  category: OutCategory
  hero: PhotoKey
  /** Three one-line takeaways, shown first */
  takeaways: [string, string, string]
  body: OutSection[]
}

export interface OutGuide extends OutGuideDraft {
  collection: Collection
  readMinutes: number
}

const words = (d: OutGuideDraft) =>
  [d.dek, ...d.takeaways, ...d.body.flatMap(s => [s.heading, ...s.paragraphs, ...(s.tips ?? [])])].join(' ').split(/\s+/).length

const finish = (collection: Collection) => (d: OutGuideDraft): OutGuide => ({ ...d, collection, readMinutes: Math.max(2, Math.round(words(d) / 220)) })

export const OUT_GUIDES: OutGuide[] = [...GOING_OUT_A, ...GOING_OUT_B].map(finish('going-out'))
export const WOMEN: OutGuide[] = WOMEN_GUIDES.map(finish('women'))
export const ALL_OUT_GUIDES: OutGuide[] = [...OUT_GUIDES, ...WOMEN]

export const outGuideHref = (g: Pick<OutGuide, 'slug' | 'collection'>) => (g.collection === 'women' ? `/guides/women/${g.slug}` : `/guides/${g.slug}`)
export const getOutGuide = (collection: Collection, slug: string) => (collection === 'women' ? WOMEN : OUT_GUIDES).find(g => g.slug === slug)
export const outSectionId = (heading: string) => slugify(heading)

/** The next guide in the same collection, wrapping round. */
export function nextOutGuide(g: OutGuide) {
  const list = g.collection === 'women' ? WOMEN : OUT_GUIDES
  return list[(list.findIndex(x => x.slug === g.slug) + 1) % list.length]
}

export const GUIDES_HUB_CRUMBS: Crumb[] = [
  { label: 'Home', href: '/' },
  { label: 'Guides', href: '/guides' },
]
export const WOMEN_HUB_CRUMBS: Crumb[] = [...GUIDES_HUB_CRUMBS, { label: 'For women', href: '/guides/women' }]

/** The night in five stops, each with the guides that belong to it (both collections). */
export const NIGHT_STAGES = [
  {
    key: 'before',
    time: '4 PM',
    label: 'Before you go',
    line: 'Picking a night, reading the listing, deciding who to bring.',
    slugs: ['first-house-party', 'going-to-a-party-alone', 'how-to-read-an-event-listing', 'free-vs-paid-house-parties', 'planning-a-weekend-of-house-parties', 'choosing-a-house-party-you-feel-good-about', 'women-only-events-explained', 'reading-the-crowd-mix', 'going-with-friends-or-alone', 'going-out-solo-safely'],
  },
  {
    key: 'in',
    time: '6 PM',
    label: 'Getting in',
    line: 'Requests, tickets and what goes in the bag.',
    slugs: ['how-request-to-join-works', 'how-to-get-accepted-to-a-house-party', 'what-to-bring-to-a-house-party', 'what-to-wear-to-a-house-party'],
  },
  {
    key: 'party',
    time: '9 PM',
    label: 'At the party',
    line: 'Rooftops, game nights, dinners with strangers and the unwritten rules.',
    slugs: ['house-party-etiquette', 'first-rooftop-party', 'first-game-night', 'dinner-party-with-strangers', 'living-room-gig-etiquette', 'introverts-guide-to-house-parties', 'setting-boundaries-at-a-party', 'when-the-party-isnt-your-vibe', 'if-you-feel-uncomfortable-at-a-party', 'using-sos-and-live-location'],
  },
  {
    key: 'home',
    time: '1 AM',
    label: 'Getting home',
    line: 'Leaving well, and arriving home safe.',
    slugs: ['leaving-a-party-early', 'getting-home-safely-after-a-party', 'getting-home-late-at-night'],
  },
  {
    key: 'after',
    time: 'Next day',
    label: 'The morning after',
    line: 'Ratings, new friends and maybe your own night.',
    slugs: ['rating-and-reviewing-a-host', 'how-to-make-friends-in-a-new-city', 'hosting-a-women-only-night'],
  },
] as const

/** Guides for a stage, in order, skipping any slug that isn't written yet. */
export const stageGuides = (slugs: readonly string[]) =>
  slugs.map(s => ALL_OUT_GUIDES.find(g => g.slug === s)).filter((g): g is OutGuide => !!g)

/** The suggested first four reads. */
export const START_HERE = ['first-house-party', 'how-request-to-join-works', 'house-party-etiquette', 'getting-home-safely-after-a-party']
