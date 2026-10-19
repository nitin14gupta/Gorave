import Link from 'next/link'
import { EVENT_TYPES } from '@/constants'
import { CROWDS } from '@/lib/crowd'
import { TIMES } from '@/lib/time'
import { OCCASIONS } from '@/lib/occasion'
import { Chapter } from '@/components/ui/atoms'

/**
 * "Explore {place}": one block of plain links to every page family for a city
 * (or India-wide when citySlug is null): when, who it's for, kind of night and
 * the hosts. Good for people deciding, and it's how search engines find the
 * long-tail pages.
 */
export function ExploreLinks({ place, citySlug, current }: { place: string; citySlug: string | null; current?: string }) {
  const base = citySlug ? `/${citySlug}` : ''
  const groups = [
    { title: 'When', links: TIMES.map(t => ({ slug: t.slug, label: t.label, href: `${base}/${t.slug}` })) },
    { title: 'Who it’s for', links: CROWDS.map(c => ({ slug: c.slug, label: c.label, href: `${base}/${c.slug}` })) },
    { title: 'Kind of night', links: EVENT_TYPES.map(t => ({ slug: t.slug, label: t.label, href: `${base}/${t.slug}` })) },
    { title: 'Occasions', links: OCCASIONS.map(o => ({ slug: o.slug, label: o.name, href: `${base}/${o.slug}` })) },
    { title: 'Budget', links: [{ slug: 'free-events', label: 'Free events', href: `${base}/free-events` }, { slug: 'under-500', label: 'Under ₹500', href: `${base}/under-500` }] },
    {
      title: 'People',
      links: citySlug
        ? [{ slug: 'hosts', label: `Hosts in ${place}`, href: `${base}/hosts` }, { slug: 'host', label: 'Host your own', href: '/host' }]
        : [{ slug: 'cities', label: 'All cities', href: '/cities' }, { slug: 'host', label: 'Host your own', href: '/host' }],
    },
  ]
  return (
    <section className="bg-paper px-6 py-20 md:px-20">
      <div className="mx-auto max-w-[1280px]">
        <Chapter n="+" title={`Explore ${place}`} />
        <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {groups.map(g => (
            <div key={g.title}>
              <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">{g.title}</div>
              <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                {g.links.map(l => (
                  <li key={l.href}>
                    {l.slug === current ? (
                      <span className="font-sans text-[15px] font-bold text-orange">{l.label}</span>
                    ) : (
                      <Link href={l.href} className="group flex items-baseline justify-between font-sans text-[15px] text-ink-2 transition-colors hover:text-ink">
                        {l.label} <span className="text-ink-3 transition-transform duration-300 group-hover:translate-x-1">→</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
