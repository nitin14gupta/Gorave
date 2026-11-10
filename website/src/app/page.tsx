import { CITIES } from '@/constants'
import { buildCityKit } from '@/lib/cityKit'
import { cardEvents, fetchReviews } from '@/api/apiService'
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
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { LiveEventsProvider } from '@/components/ui/LiveEvents'

export const revalidate = 60

export default async function HomePage() {
  const [perCity, reviews] = await Promise.all([
    Promise.all(CITIES.map(c => cardEvents({ city: c.name, limit: 12 }))),
    // More than we show (20 is the API's cap): the section keeps the best, without repeats.
    fetchReviews(20),
  ])
  const byCity = Object.fromEntries(CITIES.map((c, i) => [c.name, perCity[i].events]))
  // The phone mock-ups show real events with photos when there are any.
  const featured = perCity.flatMap(r => r.events).filter(e => e.image)
  // Each city's own flyers, built from its real events (the app's invite
  // templates if a city has none yet).
  const cityPosters = perCity.map(r => buildCityKit(r.live ? r.events : []).posters)
  return (
    <LiveEventsProvider events={featured}>
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
          items={CITIES.map(c => ({ label: c.name, href: `/${c.slug}` }))}
          rowPosters={cityPosters}
        />
        <MoreThanInvite />
        <Safety />
        <Hosts />
        <Testimonials data={reviews} />
      </main>
      <SiteFooter />
      <FloatingDock />
    </LiveEventsProvider>
  )
}
