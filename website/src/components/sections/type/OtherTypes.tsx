import Image from 'next/image'
import Link from 'next/link'
import { EVENT_TYPES, PHOTOS, type City } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

/** Chapter 09 — not feeling it? The other five kinds of night in the same city. */
/** `hub` links to the India-wide hubs (/house-parties) instead of this city's pages. */
export function OtherTypes({ city, current, hub, chapter = '09' }: { city: City; current: string; hub?: boolean; chapter?: string }) {
  const others = EVENT_TYPES.filter(t => t.slug !== current)
  return (
    <section className="bg-paper px-6 py-24 md:px-20 md:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Chapter n={chapter} title="Something else" />
        <h2 className="mt-4 font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
          {hub ? 'Other kinds of night.' : `Other nights in ${city.name}.`}
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {others.map((t, i) => (
            <Link
              key={t.slug}
              href={hub ? `/${t.slug}` : `/${city.slug}/${t.slug}`}
              className={cn(
                'group relative flex h-[300px] flex-col justify-end overflow-hidden rounded-[28px] p-5 transition-transform duration-500 ease-out-expo hover:-translate-y-2',
                i % 2 ? 'hover:rotate-[1.2deg]' : 'hover:-rotate-[1.2deg]',
                t.tint,
              )}
            >
              <div className="absolute inset-x-5 top-5 h-[150px] overflow-hidden rounded-2xl transition-[height] duration-500 ease-out-expo group-hover:h-[200px]">
                <Image src={PHOTOS[t.photo]} alt="" fill sizes="260px" className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-110" />
              </div>
              <div className={cn('relative font-display text-2xl font-extrabold tracking-[-0.035em]', t.ink)}>{t.label}</div>
              <div className={cn('relative mt-0.5 font-sans text-sm opacity-75', t.ink)}>
                {t.blurb} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
