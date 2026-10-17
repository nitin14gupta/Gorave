import { BROWSE_CITIES, SAMPLE_EVENTS } from '@/constants'
import { cardEvents, fetchReviews } from '@/lib/api'
import { Hero } from '@/components/sections/home/Hero'
import { ThisWeek } from '@/components/sections/home/ThisWeek'
import { OneLink } from '@/components/sections/home/OneLink'
import { GroupChat } from '@/components/sections/home/GroupChat'
import { EventTypes } from '@/components/sections/home/EventTypes'
import { Cities } from '@/components/sections/home/Cities'
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
    fetchReviews(4),
  ])
  const byCity = Object.fromEntries(BROWSE_CITIES.map((c, i) => [c, perCity[i].events]))
  // Mock-up screens show real events with photos; samples only if the API is down.
  const featured = perCity.flatMap(r => r.events).filter(e => e.image)
  return (
    <LiveEventsProvider events={featured.length ? featured : SAMPLE_EVENTS}>
      <main>
        <Hero />
        <ThisWeek byCity={byCity} />
        <OneLink />
        <GroupChat />
        <EventTypes />
        <Cities />
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
