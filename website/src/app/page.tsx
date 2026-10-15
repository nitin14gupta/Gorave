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

export default function HomePage() {
  return (
    <>
      <main>
        <Hero />
        <ThisWeek />
        <OneLink />
        <GroupChat />
        <EventTypes />
        <Cities />
        <MoreThanInvite />
        <Safety />
        <Hosts />
        <Testimonials />
        <SaturdayCta />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
