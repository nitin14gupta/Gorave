import type { City, SampleEvent } from '@/constants'
import type { TypeStory } from '@/lib/eventType'
import { PosterStack } from '@/components/sections/city/PosterStack'
import { AreaReveal } from '@/components/sections/city/AreaReveal'
import { Vortex } from '@/components/sections/city/Vortex'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { TypeHero } from './TypeHero'
import { TypeEvents } from './TypeEvents'
import { Anatomy } from './Anatomy'
import { GuestList } from './GuestList'
import { HourByHour } from './HourByHour'
import { InviteBuilder } from './InviteBuilder'
import { OtherTypes } from './OtherTypes'
import { buildCityKit } from '@/lib/cityKit'
import { CityKitProvider } from '@/components/sections/city/CityKit'

interface Props {
  city: City
  slug: string
  story: TypeStory
  events: SampleEvent[]
}

/**
 * City × event type (/mumbai/house-parties), ten chapters about one kind of
 * night in one city. Same layout for all 48 pages; only city + story change.
 */
export function TypePageView({ city, slug, story, events }: Props) {
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Cities', href: '/cities' },
    { label: city.name, href: `/${city.slug}` },
    { label: story.plural, href: `/${city.slug}/${slug}` },
  ]
  const noun = story.plural.toLowerCase()
  // Client sections get the data only; the faq builder stays on the server.
  const { faq, ...content } = story
  const kit = buildCityKit(events)
  return (
    <>
      <CityKitProvider kit={kit}>
      <main>
        <TypeHero city={city} story={content} crumbs={crumbs} />
        <TypeEvents city={city} events={events} />
        <Anatomy city={city} story={content} />
        <GuestList city={city} story={content} />
        <PosterStack
          city={city}
          chapter="04"
          chapterTitle="The flyers"
          title={<>Every flyer,<br />a different night.</>}
          subtitle={`Hover one: ${noun} in ${city.name} come in every flavour.`}
        />
        <HourByHour city={city} story={content} />
        <AreaReveal city={city} chapter="06" title={`${story.plural} near you.`} subtitle={`Pick your part of ${city.name}.`} typeSlug={slug} />
        <InviteBuilder city={city} story={content} />
        <Faq chapter="08" title={`${story.plural} in ${city.name}`} items={faq(city)} />
        <OtherTypes city={city} current={slug} />
        <Vortex city={city} chapter="10" posters={kit.posters} />
      </main>
      </CityKitProvider>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
