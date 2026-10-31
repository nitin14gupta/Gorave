import { BROWSE_CITIES, CITIES, SAMPLE_EVENTS } from '@/constants'
import { buildCityKit } from '@/lib/cityKit'
import { cardEvents, fetchReviews } from '@/lib/api'
import { Hero } from '@/components/sections/home/Hero'
import { ThisWeek } from '@/components/sections/home/ThisWeek'
import { OneLink } from '@/components/sections/home/OneLink'
import { GroupChat } from '@/components/sections/home/GroupChat'
import { EventTypes } from '@/components/sections/home/EventTypes'
import { AreaReveal } from '@/components/sections/city/AreaReveal'
import { MoreThanInvite } from '@/components/sections/home/MoreThanInvite'
import { Safety } from '@/components/sections/home/Safety'
import { Hosts } from '@/components/sections/home/Hosts'
import { Testimonials } from '@/components/sections/home/Testimonials'
import { SaturdayCta } from '@/components/sections/home/SaturdayCta'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { LiveEventsProvider } from '@/components/ui/LiveEvents'

export const revalidate = 60

export default async function HomePage() {
  const [perCity, reviews] = await Promise.all([
    Promise.all(BROWSE_CITIES.map(c => cardEvents({ city: c, limit: 12 }, e => e.city === c))),
    // More than we show (20 is the API's cap): the section keeps the best, without repeats.
    fetchReviews(20),
  ])
  const byCity = Object.fromEntries(BROWSE_CITIES.map((c, i) => [c, perCity[i].events]))
  // Mock-up screens show real events with photos; samples only if the API is down.
  const featured = perCity.flatMap(r => r.events).filter(e => e.image)
  // Each city's own flyers, built from its real events (the app's invite
  // templates if a city has none yet).
  const cityRows = BROWSE_CITIES.map(name => CITIES.find(c => c.name === name)).filter(c => !!c)
  const cityPosters = cityRows.map(c => {
    const r = perCity[BROWSE_CITIES.indexOf(c.name as (typeof BROWSE_CITIES)[number])]
    return buildCityKit(r?.live ? r.events : []).posters
  })
  return (
    <LiveEventsProvider events={featured.length ? featured : SAMPLE_EVENTS}>
      <main>
        <Hero />
        <ThisWeek byCity={byCity} />
        <OneLink />
        <GroupChat />
        <EventTypes />
        <AreaReveal
          chapter=""
          kicker="The cities"
          title="Pick your city."
          subtitle="Hover a city to see what's on there this week."
          items={cityRows.map(c => ({ label: c.name, href: `/${c.slug}` }))}
          rowPosters={cityPosters}
        />
        <MoreThanInvite />
        <Safety />
        <Hosts />
        <Testimonials data={reviews} />
        <SaturdayCta />
      </main>
      <SiteFooter />
      <FloatingDock />
    </LiveEventsProvider>
  )
}
