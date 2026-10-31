import type { City, SampleEvent } from '@/constants'
import { buildCityKit } from '@/lib/cityKit'
import { CityKitProvider } from './CityKit'
import type { PublicHostCard } from '@/lib/api'
import { HostsStrip } from '@/components/sections/hosts/HostsStrip'
import { cityFaq } from '@/lib/city'
import { CityHero, type HeroKind } from './heroes'
import { PosterStack } from './PosterStack'
import { AfterDark } from './AfterDark'
import { NowBoarding } from './NowBoarding'
import { SpinSaturday } from './SpinSaturday'
import { VibePanels } from './VibePanels'
import { AreaReveal } from './AreaReveal'
import { Budget } from './Budget'
import { Crowd } from './Crowd'
import { CityHost } from './CityHost'
import { OtherCities } from './OtherCities'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { ExploreLinks } from '@/components/sections/shared/ExploreLinks'

// The hero the live /[city] pages use. Change this one line after picking in /lab/city.
export const CITY_HERO: HeroKind = 'letters'

/**
 * The city page, told as one night out, eleven chapters from "the reasons"
 * to "see you out there". Identical for every city; only `city` data changes.
 */
export function CityPageView({ city, hero = CITY_HERO, events = [], hosts = [], hostTotal = 0 }: { city: City; hero?: HeroKind; events?: SampleEvent[]; hosts?: PublicHostCard[]; hostTotal?: number }) {
  const kit = buildCityKit(events)
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Cities', href: '/cities' },
    { label: city.name, href: `/${city.slug}` },
  ]
  return (
    <>
      <CityKitProvider kit={kit}>
      <main>
        <CityHero kind={hero} city={city} crumbs={crumbs} />
        <PosterStack city={city} />
        <AfterDark city={city} />
        <NowBoarding city={city} />
        <SpinSaturday city={city} />
        <VibePanels city={city} />
        <AreaReveal city={city} />
        <Budget city={city} />
        <Crowd city={city} />
        <CityHost city={city} />
        <HostsStrip hosts={hosts} total={hostTotal} place={city.name} href={`/${city.slug}/hosts`} />
        <ExploreLinks place={city.name} citySlug={city.slug} />
        <Faq chapter="10" title={`Going out in ${city.name}`} items={cityFaq(city)} />
        <OtherCities current={city} />
      </main>
      </CityKitProvider>
      <SiteFooter place={city.name} />
      <FloatingDock />
    </>
  )
}
