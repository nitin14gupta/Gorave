import type { City } from '@/constants'
import type { Crumb } from '@/lib/seo'

export interface HeroProps {
  city: City
  crumbs: Crumb[]
}

export const HERO_KINDS = ['letters', 'map', 'flap', 'deck'] as const
export type HeroKind = (typeof HERO_KINDS)[number]

export const HERO_LABELS: Record<HeroKind, string> = {
  letters: 'Letters',
  map: 'Live map',
  flap: 'Split-flap',
  deck: 'Swipe deck',
}
