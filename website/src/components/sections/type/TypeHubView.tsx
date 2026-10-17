import { CITIES, type City, type SampleEvent } from '@/constants'
import type { TypeStory } from '@/lib/eventType'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { TypeHero } from './TypeHero'
import { TypeEvents } from './TypeEvents'
import { Anatomy } from './Anatomy'
import { TypeCities } from './TypeCities'
import { HourByHour } from './HourByHour'
import { InviteBuilder } from './InviteBuilder'
import { OtherTypes } from './OtherTypes'

// The hub talks about the whole country; the city sections read `name` and
// `areas`, so India stands in as a "city" whose areas are our cities.
export const INDIA: City = { name: 'India', slug: '', state: '', coords: '', areas: CITIES.map(c => c.name), photo: 'party1' }

interface Props {
  slug: string
  story: TypeStory
  events: SampleEvent[]
  cities: { city: City; count: number }[]
}

/**
 * Event-type hub (/house-parties) — one kind of night across India. Same
 * story sections as the city pages, plus a postcard picker for every city.
 */
export function TypeHubView({ slug, story, events, cities }: Props) {
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: story.plural, href: `/${slug}` },
  ]
  const { faq, ...content } = story
  return (
    <>
      <main>
        <TypeHero city={INDIA} story={content} crumbs={crumbs} />
        <TypeEvents city={INDIA} events={events} />
        <Anatomy city={INDIA} story={content} />
        <TypeCities story={content} slug={slug} cities={cities} />
        <HourByHour city={INDIA} story={content} chapter="04" />
        <InviteBuilder city={INDIA} story={content} chapter="05" />
        <Faq chapter="06" title={`${story.plural} in India`} items={faq(INDIA)} />
        <OtherTypes city={INDIA} current={slug} hub chapter="07" />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
