import Link from 'next/link'
import type { City } from '@/constants'
import { areaSlug } from '@/lib/city'
import type { Crumb } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Chapter } from '@/components/ui/atoms'
import { Faq } from '@/components/sections/shared/Faq'
import { OtherTypes } from '@/components/sections/type/OtherTypes'
import { INDIA } from '@/components/sections/type/TypeHubView'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { CityPostcards } from './CityPostcards'

const FAQ = [
  { q: 'Which cities is Gorave in?', a: 'Mumbai, Bangalore, Delhi, Pune, Hyderabad, Goa, Chennai and Kolkata, with more on the way. Anyone in these cities can host or join.' },
  { q: 'My city isn’t listed. Can I still host?', a: 'Not yet on the map, but the app is where new cities open first: the more people host in a place, the sooner it gets its own page.' },
  { q: 'How do I find events near me?', a: 'Open your city, then pick a neighbourhood or a kind of night. In the app you see events closest to you first.' },
]

/** /cities, every city as a postcard, then every neighbourhood as a plain index (good for people and for search). */
export function CitiesView({ cities, crumbs }: { cities: { city: City; count: number }[]; crumbs: Crumb[] }) {
  return (
    <>
      <main>
        <section className="bg-cream px-6 pb-10 pt-28 md:px-20">
          <Breadcrumbs crumbs={crumbs} />
          <h1 className="mt-8 font-display text-[clamp(60px,11vw,180px)] font-extrabold leading-[0.84] tracking-[-0.065em]">
            Eight cities.<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-orange">One Saturday.</span>
          </h1>
          <p className="mt-6 max-w-[520px] font-sans text-xl leading-relaxed text-ink-2">
            House parties, rooftops, game nights and dinner parties, hosted in homes across India. Pick yours.
          </p>
        </section>

        <CityPostcards cities={cities} />

        <section className="bg-paper px-6 py-24 md:px-20 md:py-28">
          <div className="mx-auto max-w-[1280px]">
            <Chapter n="02" title="Every neighbourhood" />
            <h2 className="mt-4 font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">Closer to home.</h2>
            <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {cities.map(({ city }) => (
                <div key={city.slug}>
                  <Link href={`/${city.slug}`} className="font-display text-2xl font-extrabold tracking-[-0.04em] hover:text-orange">{city.name}</Link>
                  <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                    {city.areas.map(a => (
                      <li key={a}>
                        <Link href={`/${city.slug}/${areaSlug(a)}`} className="group flex items-baseline justify-between font-sans text-[15px] text-ink-2 transition-colors hover:text-ink">
                          {a} <span className="text-ink-3 transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <OtherTypes city={INDIA} current="" hub chapter="03" />
        <Faq chapter="04" title="Cities, answered" items={FAQ} />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
