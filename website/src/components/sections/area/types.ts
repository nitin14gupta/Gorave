import type { SampleEvent } from '@/constants'
import type { Area } from '@/lib/area'
import type { Crumb } from '@/lib/seo'

/** Everything a neighbourhood-page variant receives. Plain data only (client-safe). */
export interface AreaViewProps {
  area: Area
  events: SampleEvent[]
  crumbs: Crumb[]
  faq: { q: string; a: string }[]
}
