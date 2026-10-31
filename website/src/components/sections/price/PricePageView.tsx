import Link from 'next/link'
import { CITIES } from '@/constants'
import { priceHref, type PriceProps } from '@/lib/price'
import { Faq } from '@/components/sections/shared/Faq'
import { ExploreLinks } from '@/components/sections/shared/ExploreLinks'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { PriceHero } from './PriceHero'
import { PriceList } from './PriceList'
import { Receipt } from './Receipt'
import { FlipCards } from './FlipCards'
import { Places } from './Places'
import { AreaReveal } from '@/components/sections/city/AreaReveal'
import { CityKitProvider } from '@/components/sections/city/CityKit'
import { buildCityKit } from '@/lib/cityKit'

/**
 * /free-events and /under-500, India-wide, per city and per neighbourhood.
 * A hanging price tag, the list cheapest first, the receipt printing as you
 * scroll, flip-card questions, every place as hover-pop names, the other
 * budget, questions and the way out.
 */
export function PricePageView(props: PriceProps) {
  const { tier, place, other, events } = props
  const kit = buildCityKit(events)
  const where = place.kind === 'india' ? 'across India' : `in ${place.name}`
  return (
    <CityKitProvider kit={kit}>
      <main className="bg-cream">
        <PriceHero {...props} />
        <PriceList {...props} />
        <Receipt {...props} />
        <FlipCards {...props} />
        <Places {...props} />
        {place.city ? (
          <AreaReveal
            city={place.city}
            chapter="05"
            title={`${tier.label}, street by street.`}
            subtitle={`Every neighbourhood in ${place.city.name}. Hover one to see what’s on.`}
            typeSlug={tier.slug}
          />
        ) : (
          <AreaReveal
            chapter="05"
            kicker="The cities"
            title={`${tier.label}, city by city.`}
            subtitle="Hover a city to see what’s on, tap to go."
            items={CITIES.map(c => ({ label: c.name, href: `/${c.slug}/${tier.slug}` }))}
          />
        )}

        <section className="bg-paper px-6 py-20 md:px-12 lg:px-20">
          <div className="mx-auto grid max-w-[1180px] gap-3 md:grid-cols-2">
            <Link href={priceHref(props, other.slug)} className="group flex min-h-[220px] flex-col justify-between rounded-[32px] bg-brand p-8 text-white transition-transform duration-500 ease-out-expo hover:-translate-y-1">
              <span className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-white/75">Other budget</span>
              <span className="font-display text-[clamp(36px,4.4vw,64px)] font-extrabold leading-[0.92] tracking-[-0.055em]">{other.label} {where}</span>
              <span className="font-sans text-sm font-bold">See them <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span></span>
            </Link>
            <Link href={place.kind === 'area' ? `/${place.city!.slug}/${place.area!.slug}` : place.kind === 'city' ? `/${place.city!.slug}` : '/cities'} className="group flex min-h-[220px] flex-col justify-between rounded-[32px] bg-cream p-8 transition-[transform,background-color,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:bg-white hover:shadow-soft">
              <span className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">Any budget</span>
              <span className="font-display text-[clamp(36px,4.4vw,64px)] font-extrabold leading-[0.92] tracking-[-0.055em]">Everything {where}</span>
              <span className="font-sans text-sm font-bold">Browse all <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span></span>
            </Link>
          </div>
        </section>

        <Faq chapter="06" title={`${tier.label} nights, answered`} items={tier.faq} />
        <ExploreLinks place={place.city?.name ?? 'India'} citySlug={place.city?.slug ?? null} current={tier.slug} />
      </main>
      <SiteFooter place={place.name} />
      <FloatingDock />
    </CityKitProvider>
  )
}
