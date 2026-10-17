import Link from 'next/link'
import { Chapter } from '@/components/ui/atoms'

export interface PlaceLink {
  label: string
  href: string
}

/**
 * Where this host throws their nights: their neighbourhoods, city and kinds of
 * night, each linking to that page (and the city's other hosts).
 */
export function HostPlaces({ first, areas, cities, types }: { first: string; areas: PlaceLink[]; cities: PlaceLink[]; types: PlaceLink[] }) {
  if (!areas.length && !cities.length && !types.length) return null
  const groups = [
    { title: 'Neighbourhoods', links: areas },
    { title: 'Cities', links: cities },
    { title: 'Kinds of night', links: types },
  ].filter(g => g.links.length)
  return (
    <section className="bg-cream px-6 pb-24 md:px-20">
      <div className="mx-auto max-w-[1280px] rounded-[32px] bg-white p-8 shadow-soft md:p-12">
        <Chapter n="02" title="Where they host" />
        <h2 className="mt-4 font-display text-[clamp(32px,3.6vw,52px)] font-extrabold leading-[0.95] tracking-[-0.05em]">Where {first} hosts.</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {groups.map(g => (
            <div key={g.title}>
              <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">{g.title}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {g.links.map(l => (
                  <Link key={l.href} href={l.href} className="rounded-full bg-cream px-4 py-2.5 font-sans text-sm font-bold transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-cream">
                    {l.label} →
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
