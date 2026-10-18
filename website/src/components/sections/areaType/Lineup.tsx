import Image from 'next/image'
import Link from 'next/link'
import { PHOTOS, type SampleEvent } from '@/constants'
import type { AreaTypeProps } from '@/lib/areaType'
import { ProofLink } from '@/components/ui/ProofLink'
import { Head } from './kit'

/**
 * Chapter 01, the lineup. Real events as quiet rows: when, what, where,
 * price. Hover a row and its photo slides open inside it while the title
 * steps aside. A quiet neighbourhood shows the same night nearby.
 */
export function Lineup({ area, type, story, events, nearby }: AreaTypeProps) {
  const here = events.length > 0
  const list = (here ? events : nearby).slice(0, 8)
  const noun = story.plural.toLowerCase()
  const { city } = area

  return (
    <section className="bg-cream px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1180px]">
        <Head
          n="01"
          label="The lineup"
          title={here ? `On in ${area.name}.` : `Quiet in ${area.name}.`}
          serif={here ? undefined : 'Here’s nearby.'}
          aside={
            here
              ? `Every ${story.singular} listed in and around ${area.name} right now.`
              : list.length
                ? `Nothing listed in ${area.name} this week. The closest ${noun} in ${city.name}:`
                : `No ${noun} listed in ${city.name} this week. Check back Thursday, or host the first one.`
          }
        />

        {list.length > 0 && (
          <ul className="mt-12 border-t border-ink/12">
            {list.map(e => <Row key={e.id} e={e} />)}
          </ul>
        )}

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          <ProofLink href={`/${city.slug}/${type.slug}`}>All {noun} in {city.name}</ProofLink>
          <ProofLink href={`/${city.slug}/${area.slug}`}>Everything in {area.name}</ProofLink>
          {!here && <ProofLink href="/host">Host the first one</ProofLink>}
        </div>
      </div>
    </section>
  )
}

function Row({ e }: { e: SampleEvent }) {
  const [day, time] = e.when.split(' · ')
  return (
    <li>
      <Link
        href={`/e/${e.id}`}
        className="group grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-ink/12 py-5 transition-colors duration-500 hover:bg-white md:grid-cols-[110px_auto_1fr_auto_auto] md:gap-6 md:px-4"
      >
        <div className="font-sans text-sm font-bold leading-tight">
          <div>{day}</div>
          <div className="text-ink-3">{time}</div>
        </div>
        {/* The photo opens inside the row */}
        <div className="relative hidden h-[84px] w-0 overflow-hidden rounded-2xl transition-[width] duration-700 ease-out-expo group-hover:w-[140px] md:block">
          <Image src={e.image ?? PHOTOS[e.photo]} alt="" fill sizes="140px" className="scale-110 object-cover transition-transform duration-700 ease-out-expo group-hover:scale-100" />
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-[22px] font-extrabold tracking-[-0.035em] md:text-[30px]">{e.title}</div>
          <div className="mt-0.5 font-sans text-[13px] font-bold text-ink-3">
            {e.area}{e.mix ? ` · ${e.mix}` : ''}{e.request ? ' · Request to join' : ''}
          </div>
        </div>
        <div className="hidden font-sans text-sm font-bold text-ink-2 md:block">{e.going} going</div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white px-3 py-1.5 font-sans text-sm font-bold shadow-soft transition-colors duration-500 group-hover:bg-ink group-hover:text-cream">{e.price}</span>
          <span aria-hidden className="hidden text-xl text-ink-3 transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:text-ink md:inline">→</span>
        </div>
      </Link>
    </li>
  )
}
