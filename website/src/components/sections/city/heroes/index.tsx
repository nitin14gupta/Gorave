import { HeroLetters } from './HeroLetters'
import { HeroMap } from './HeroMap'
import { HeroFlap } from './HeroFlap'
import { HeroDeck } from './HeroDeck'
import type { HeroKind, HeroProps } from './types'

export { HERO_KINDS, HERO_LABELS, type HeroKind } from './types'

export function CityHero({ kind, ...props }: HeroProps & { kind: HeroKind }) {
  if (kind === 'map') return <HeroMap {...props} />
  if (kind === 'flap') return <HeroFlap {...props} />
  if (kind === 'deck') return <HeroDeck {...props} />
  return <HeroLetters {...props} />
}
