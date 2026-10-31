import Link from 'next/link'
import type { City } from '@/constants'
import type { PublicHostCard } from '@/lib/api'
import { areaSlug } from '@/lib/city'
import type { Crumb } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Chapter } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { Stagger } from '@/components/sections/type/Stagger'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { HostCard } from './HostCard'

interface Props {
  city: City
  /** Set for a neighbourhood page (/mumbai/bandra/hosts) */
  area?: string
  hosts: PublicHostCard[]
  total: number
  crumbs: Crumb[]
}

/** Hosts in a city or neighbourhood: real people, most active first, each linking to their profile. */
export function HostsView({ city, area, hosts, total, crumbs }: Props) {
  const place = area ?? city.name
  const others = area ? city.areas.filter(a => a !== area) : city.areas
  return (
    <>
      <main className="bg-cream">
        <section className="px-6 pb-12 pt-28 md:px-20">
          <Breadcrumbs crumbs={crumbs} />
          <h1 className="mt-8 font-display text-[clamp(56px,10vw,160px)] font-extrabold leading-[0.86] tracking-[-0.065em]">
            Hosts in<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-orange">{place}.</span>
          </h1>
          <p className="mt-6 max-w-[540px] font-sans text-xl leading-relaxed text-ink-2">
            {total > 0
              ? `${total} ${total === 1 ? 'person hosts' : 'people host'} house parties, rooftops, game nights and dinners in ${place}. Most active first.`
              : `Nobody has hosted in ${place} yet. The first one could be you.`}
          </p>
        </section>

        <section className="px-6 pb-24 md:px-20">
          <div className="mx-auto max-w-[1280px]">
            {hosts.length ? (
              <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {hosts.map(h => <HostCard key={h.username} host={h} />)}
              </Stagger>
            ) : (
              <div className="rounded-[32px] border-[1.5px] border-dashed border-ink/25 px-8 py-16 text-center">
                <div className="font-display text-[clamp(28px,3.4vw,44px)] font-extrabold tracking-[-0.04em]">Be the first host in {place}.</div>
                <div className="mt-7 flex justify-center"><Button href="/host" size="lg">Start hosting</Button></div>
              </div>
            )}
          </div>
        </section>

        <section className="bg-paper px-6 py-20 md:px-20">
          <div className="mx-auto max-w-[1280px]">
            <Chapter n="01" title={area ? `More of ${city.name}` : 'By neighbourhood'} />
            <h2 className="mt-4 font-display text-[clamp(36px,4.4vw,64px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              {area ? `Hosts around ${area}.` : `Hosts near you in ${city.name}.`}
            </h2>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {area && (
                <Link href={`/${city.slug}/hosts`} className="rounded-full bg-ink px-5 py-3 font-sans text-sm font-bold text-cream">
                  All of {city.name}
                </Link>
              )}
              {others.map(a => (
                <Link key={a} href={`/${city.slug}/${areaSlug(a)}/hosts`} className="rounded-full bg-white px-5 py-3 font-sans text-sm font-bold shadow-soft transition-transform hover:-translate-y-0.5">
                  {a}
                </Link>
              ))}
            </div>
            <Link href={area ? `/${city.slug}/${areaSlug(area)}` : `/${city.slug}`} className="mt-8 inline-block font-sans text-sm font-bold underline-offset-4 hover:underline">
              What’s on in {place} →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter place={place} />
      <FloatingDock />
    </>
  )
}
