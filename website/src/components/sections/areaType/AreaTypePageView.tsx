import type { AreaTypeProps } from '@/lib/areaType'
import { HostsStrip } from '@/components/sections/hosts/HostsStrip'
import { ExploreLinks } from '@/components/sections/shared/ExploreLinks'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { Window } from './Window'
import { Lineup } from './Lineup'
import { Feeling } from './Feeling'
import { FlyThrough } from './FlyThrough'
import { Clock } from './Clock'
import { GettingIn } from './GettingIn'
import { CityGrid } from './CityGrid'

/**
 * /[city]/[area]/[type], one kind of night in one neighbourhood, told as a
 * night: zoom in through a window, see what's on, feel the place, fly
 * through what makes it work, live it by the clock, get in, look at the
 * whole city, then the window closes into your ticket.
 */
export function AreaTypePageView(props: AreaTypeProps) {
  const { area, story, type, hosts, hostTotal, faq } = props
  return (
    <>
      <main className="bg-cream">
        <Window {...props} />
        <Lineup {...props} />
        <Feeling {...props} />
        <FlyThrough {...props} />
        <Clock {...props} />
        <GettingIn {...props} />
        <CityGrid {...props} />
        <HostsStrip hosts={hosts} total={hostTotal} place={area.name} href={`/${area.city.slug}/${area.slug}/hosts`} />
        <Faq chapter="07" title={`${story.plural} in ${area.name}, answered`} items={faq} />
        <ExploreLinks place={area.city.name} citySlug={area.city.slug} current={type.slug} />
      </main>
      <SiteFooter place={area.name} />
      <FloatingDock />
    </>
  )
}
