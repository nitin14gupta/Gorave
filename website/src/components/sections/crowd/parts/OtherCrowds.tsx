import Image from 'next/image'
import Link from 'next/link'
import type { CrowdViewProps } from '../types'
import { Stagger } from '@/components/sections/type/Stagger'
import { Head } from './kit'

/**
 * Chapter 08, other rooms. The other three crowds as tall doorways, lights
 * low; hover one and the room brightens, the photo settles and its promise
 * slides up.
 */
export function OtherCrowds({ place, others }: Pick<CrowdViewProps, 'place' | 'others'>) {
  return (
    <section className="bg-paper px-6 py-24 md:px-20 md:py-28">
      <div className="mx-auto max-w-[1280px]">
        <Head n="09" label="Other rooms" title="A different" serif={`crowd in ${place.name}?`} />
        <Stagger className="mt-12 grid gap-4 sm:grid-cols-3">
          {others.map(o => (
            <Link key={o.slug} href={o.href} className="group relative block h-[380px] overflow-hidden rounded-[28px] bg-noir text-white md:h-[460px]">
              <Image
                src={o.image}
                alt=""
                fill
                sizes="(max-width: 640px) 92vw, 33vw"
                className="scale-[1.1] object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-black/55 transition-opacity duration-700 group-hover:opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="font-display text-[clamp(34px,3.6vw,52px)] font-extrabold leading-[0.95] tracking-[-0.05em]">{o.label}</div>
                <div className="mt-2 flex items-center justify-between gap-3 font-sans text-base text-white/80 transition-transform duration-500 ease-out-expo md:translate-y-2 md:group-hover:translate-y-0">
                  <span>{o.promise}</span>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-ink transition-transform duration-500 ease-out-expo group-hover:-rotate-45">→</span>
                </div>
              </div>
            </Link>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
