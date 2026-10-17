import type { SampleEvent } from '@/constants'
import type { CrowdContent } from '@/lib/crowd'
import type { Crumb } from '@/lib/seo'

/** Everything a crowd-page variant receives. Plain data only (client-safe). */
export interface CrowdViewProps {
  crowd: CrowdContent
  /** India hub (/women-only) or one city (/mumbai/women-only) */
  place: { name: string; citySlug: string | null }
  /** Live upcoming events for this crowd + place (sample fallback if the API is down) */
  events: SampleEvent[]
  total: number
  /** Where to go next: cities (on the hub) or neighbourhoods (on a city page), with live counts */
  places: { label: string; href: string; count: number; image: string }[]
  /** The other crowds, for cross-links */
  others: { slug: string; label: string; href: string; promise: string; image: string }[]
  faq: { q: string; a: string }[]
  crumbs: Crumb[]
}

export const CROWD_VARIANTS = ['a', 'b', 'c'] as const
export type CrowdVariant = (typeof CROWD_VARIANTS)[number]
export const CROWD_VARIANT_LABELS: Record<CrowdVariant, string> = { a: 'A', b: 'B', c: 'C' }
