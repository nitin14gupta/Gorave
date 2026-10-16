import type { Metadata } from 'next'
import Link from 'next/link'
import { CITIES } from '@/constants'
import { cn } from '@/lib/cn'
import { CityPageView } from '@/components/sections/city/CityPageView'
import { HERO_KINDS, HERO_LABELS, type HeroKind } from '@/components/sections/city/heroes'

export const metadata: Metadata = { title: 'City page lab', robots: { index: false, follow: false } }

// Internal: compare city-page heroes (and cities) before locking CITY_HERO.
export default async function CityLab({ searchParams }: PageProps<'/lab/city'>) {
  const sp = await searchParams
  const hero = (HERO_KINDS as readonly string[]).includes(String(sp.hero)) ? (sp.hero as HeroKind) : 'letters'
  const city = CITIES.find(c => c.slug === sp.city) ?? CITIES[0]

  return (
    <>
      <CityPageView city={city} hero={hero} />
      <div className="fixed bottom-5 left-5 z-[60] flex flex-col gap-2 rounded-[22px] bg-ink/90 p-2.5 text-cream shadow-pop backdrop-blur">
        <div className="px-2 pt-1 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">Hero</div>
        <div className="flex gap-1">
          {HERO_KINDS.map(k => (
            <Link
              key={k}
              href={`/lab/city?hero=${k}&city=${city.slug}`}
              scroll={false}
              className={cn('rounded-full px-3 py-1.5 font-sans text-xs font-bold', k === hero ? 'bg-cream text-ink' : 'text-noir-ink-2 hover:text-cream')}
            >
              {HERO_LABELS[k]}
            </Link>
          ))}
        </div>
        <div className="px-2 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">City</div>
        <div className="flex max-w-[360px] flex-wrap gap-1">
          {CITIES.map(c => (
            <Link
              key={c.slug}
              href={`/lab/city?hero=${hero}&city=${c.slug}`}
              scroll={false}
              className={cn('rounded-full px-3 py-1.5 font-sans text-xs font-bold', c.slug === city.slug ? 'bg-cream text-ink' : 'text-noir-ink-2 hover:text-cream')}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
