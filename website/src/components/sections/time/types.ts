import type { SampleEvent } from '@/constants'
import type { TimeContent } from '@/lib/time'
import type { Crumb } from '@/lib/seo'

/** Everything a time-page variant receives. Plain data only (client-safe). */
export interface TimeViewProps {
  time: TimeContent
  /** India hub (/tonight) or one city (/mumbai/tonight) */
  place: { name: string; citySlug: string | null }
  /** Live events in this window, soonest first (sample fallback if the API is down) */
  events: SampleEvent[]
  total: number
  /** The same events grouped by IST calendar day, in order (one group for tonight / tomorrow) */
  days: { key: string; label: string; events: SampleEvent[] }[]
  /** Cities (hub) or neighbourhoods (city page) with how many of these events each has */
  places: { label: string; href: string; count: number; image: string }[]
  /** The other time windows with live counts, for cross-links */
  others: { slug: string; label: string; href: string; promise: string; image: string; count: number }[]
  faq: { q: string; a: string }[]
  crumbs: Crumb[]
}
