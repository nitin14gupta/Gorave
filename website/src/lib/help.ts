import { HELP_TOPICS_DATA } from './helpTopics'
import { slugify, type Crumb } from './seo'

// Help centre (/help, /help/[topic]). Plain data; every answer must match
// what the app and server actually do (see lib/helpTopics.ts header).

export interface HelpQA {
  q: string
  a: string
}

export interface HelpTopic {
  slug: string
  title: string
  /** One line under the title */
  line: string
  /** Which shelf it sits on in the hub */
  group: 'Going out' | 'Money' | 'Safety' | 'Hosting' | 'Account'
  questions: HelpQA[]
}

export const HELP_TOPICS: HelpTopic[] = HELP_TOPICS_DATA

export const helpHref = (slug: string) => `/help/${slug}`
export const qId = (q: string) => slugify(q).slice(0, 80)
export const getHelpTopic = (slug: string) => HELP_TOPICS.find(t => t.slug === slug)

export const HELP_CRUMBS: Crumb[] = [
  { label: 'Home', href: '/' },
  { label: 'Help', href: '/help' },
]

export const SUPPORT_EMAIL = 'support@gorave.in'
