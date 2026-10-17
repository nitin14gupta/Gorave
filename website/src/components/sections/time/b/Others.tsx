import Image from 'next/image'
import Link from 'next/link'
import type { TimeViewProps } from '../types'
import { Stagger } from '@/components/sections/type/Stagger'
import { cn } from '@/lib/cn'
import { Head, pad } from './kit'

const TINTS = ['bg-blush', 'bg-sky', 'bg-sage', 'bg-cream-deep']

/**
 * Chapter 06, other windows. Each one is a file folder with a calendar tab;
 * its photo sits tucked inside the pocket and lifts out on hover, while the
 * live count reads off the front.
 */
export function Others({ place, others, chapter = '06' }: Pick<TimeViewProps, 'place' | 'others'> & { chapter?: string }) {
  if (!others.length) return null
  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1320px]">
        <Head n={chapter} label="Other windows" title="Not this one?" serif={`Flip to another in ${place.name}.`} />
        <Stagger className={cn('mt-14 grid gap-x-5 gap-y-8 sm:grid-cols-2', others.length >= 3 && 'lg:grid-cols-3')}>
          {others.map((o, i) => {
            const tint = TINTS[i % TINTS.length]
            return (
              <Link key={o.slug} href={o.href} className="group relative block pt-11">
                {/* Tab */}
                <span
                  className={cn('absolute left-0 top-0 flex h-12 items-start gap-2 rounded-t-[18px] px-5 pt-3 transition-[width] duration-500 ease-out-expo', tint)}
                  style={{ width: `${46 + (i % 3) * 6}%` }}
                >
                  <span className="font-serif text-base italic text-orange">{pad(i + 1)}</span>
                  <span className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink/70">{o.label}</span>
                </span>
                {/* Folder back */}
                <span className={cn('relative block h-[440px] overflow-hidden rounded-[26px] rounded-tl-none', tint)}>
                  {/* Photo, tucked in the pocket */}
                  <span className="absolute inset-x-5 top-5 block h-[250px] translate-y-10 overflow-hidden rounded-[18px] bg-tile shadow-soft transition-transform duration-700 ease-out-expo group-hover:-translate-y-1 group-hover:-rotate-[2.5deg]">
                    <Image src={o.image} alt="" fill sizes="(max-width: 640px) 90vw, 33vw" className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-105" />
                  </span>
                  {/* Pocket front */}
                  <span className="absolute inset-x-0 bottom-0 flex h-[210px] flex-col justify-between rounded-[26px] bg-white p-6 shadow-[0_-12px_30px_-20px_rgb(23_19_16/0.35)]">
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-display text-[clamp(32px,3vw,44px)] font-extrabold leading-[0.95] tracking-[-0.05em]">{o.label}</span>
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-cream transition-transform duration-500 ease-out-expo group-hover:-rotate-45">→</span>
                    </span>
                    <span className="flex items-end justify-between gap-3">
                      <span className="max-w-[60%] font-sans text-base text-ink-2">{o.promise}</span>
                      <span className="text-right">
                        {o.count > 0 ? (
                          <>
                            <span className="block font-display text-5xl font-extrabold leading-none tracking-[-0.06em]">{o.count}</span>
                            <span className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">{o.count === 1 ? 'night' : 'nights'}</span>
                          </>
                        ) : (
                          <span className="font-serif text-lg italic text-ink-3">none yet</span>
                        )}
                      </span>
                    </span>
                  </span>
                </span>
              </Link>
            )
          })}
        </Stagger>
      </div>
    </section>
  )
}
