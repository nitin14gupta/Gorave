'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import type { SampleEvent } from '@/constants'
import type { CrowdContent } from '@/lib/crowd'
import { Chapter } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { EventCard } from '@/components/ui/EventCard'
import { pad } from './kit'

interface Props {
  crowd: CrowdContent
  place: { name: string; citySlug: string | null }
  events: SampleEvent[]
  total: number
  chapter?: string
}

const MAX = 10

/**
 * Chapter 02, on the list. Real upcoming events on a rail that pins and runs
 * sideways as you scroll down, with a thin progress rule and a page counter.
 * Mobile (or a short list that already fits) is a native swipe rail.
 */
export function EventsRail({ crowd, place, events, total, chapter = '02' }: Props) {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  // Card width that lets the heading, the staggered cards and the progress
  // rule all fit in one screen while the rail is pinned.
  const [cardW, setCardW] = useState(320)
  const list = events.slice(0, MAX)
  const more = total > list.length
  const browse = place.citySlug ? `/${place.citySlug}` : '/cities'

  useEffect(() => {
    const el = track.current
    const sec = section.current
    if (!el || !sec) return
    const measure = () => {
      const wide = window.matchMedia('(min-width: 768px)').matches
      setDist(wide ? Math.max(0, Math.round(el.scrollWidth - window.innerWidth)) : 0)
      // ~420px of the screen go to the nav, heading, stagger and progress rule;
      // a card is about 1.45x as tall as it is wide (4:5 photo + text).
      setCardW(wide ? Math.round(Math.max(220, Math.min(320, (window.innerHeight - 420) / 1.45))) : 300)
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    ro.observe(sec)
    return () => ro.disconnect()
  }, [])

  const { scrollYProgress: p } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const x = useTransform(p, v => (dist ? -Math.round(v * dist) : 0))
  const bar = useTransform(p, v => (dist ? v : 1))
  const page = useTransform(p, v => pad(Math.min(list.length, 1 + Math.floor(v * list.length))))
  const pinned = dist > 0

  const head = (
    <div className="mx-auto flex max-w-[1320px] flex-wrap items-end justify-between gap-6 px-6 md:px-12 lg:px-20">
      <div>
        <Chapter n={chapter} title="On the list" />
        <h2 className="mt-4 font-display text-[clamp(44px,6vw,92px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
          Coming up<span className="font-serif font-normal italic tracking-[-0.03em] text-brand"> in {place.name}</span>.
        </h2>
      </div>
      <p className="max-w-[340px] font-sans text-lg text-ink-2">
        {total > 0 ? <><b className="text-ink">{total}</b> upcoming {crowd.nights}. </> : null}
        Area shown now, address after you&apos;re in.
      </p>
    </div>
  )

  if (!list.length) {
    return (
      <section id="events" className="scroll-mt-24 bg-cream py-24 md:py-32">
        {head}
        <div className="mx-auto mt-12 max-w-[1320px] px-6 md:px-12 lg:px-20">
          <div className="rounded-[32px] border-[1.5px] border-dashed border-ink/25 px-8 py-16 text-center">
            <div className="font-display text-[clamp(28px,3.4vw,44px)] font-extrabold tracking-[-0.04em]">
              No {crowd.nights} listed in {place.name} yet.
            </div>
            <p className="mx-auto mt-3 max-w-[460px] font-sans text-lg text-ink-2">{crowd.hostLine}</p>
            <div className="mt-7 flex justify-center"><Button href="/host" size="lg">Host the first one</Button></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={section}
      id="events"
      className="relative scroll-mt-24 bg-cream"
      style={pinned ? { height: `calc(100vh + ${dist}px)` } : undefined}
    >
      {/* Pinned: start below the floating nav instead of centring, so a tall
          heading never gets pushed off the top of the screen. */}
      <div className={pinned ? 'sticky top-0 flex h-screen flex-col justify-start overflow-hidden pt-28' : 'py-24 md:py-32'}>
        {head}
        <div className={pinned ? 'mt-8' : 'mt-12 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'}>
          <motion.div ref={track} style={{ x }} className="flex w-max items-start gap-5 px-6 pb-6 md:gap-6 md:px-12 lg:px-20">
            {list.map((e, i) => (
              <div key={e.id} className={i % 2 ? 'md:mt-8' : ''}>
                <EventCard event={e} width={cardW} />
              </div>
            ))}
            <Link
              href={browse}
              style={{ height: Math.round(cardW * 1.21) }}
              className="group flex w-[260px] shrink-0 flex-col justify-between rounded-[28px] bg-brand p-7 text-white transition-transform duration-500 ease-out-expo hover:-translate-y-1.5"
            >
              <span className="font-serif text-3xl italic text-white">{more ? `+${total - list.length}` : 'More'}</span>
              <span>
                <span className="block font-display text-[34px] font-extrabold leading-[0.95] tracking-[-0.045em]">
                  {more ? 'And more coming up.' : `Browse ${place.name}.`}
                </span>
                <span className="mt-3 inline-block font-sans text-sm font-bold text-white/85 transition-transform duration-300 group-hover:translate-x-1">
                  {place.citySlug ? `Everything in ${place.name}` : 'All cities'} →
                </span>
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Progress rule (pinned) or a swipe hint */}
        {pinned ? (
          <div className="mx-auto mt-6 flex w-full max-w-[1320px] items-center gap-5 px-6 md:px-12 lg:px-20">
            <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-ink/10">
              <motion.div style={{ scaleX: bar }} className="h-full origin-left bg-ink" />
            </div>
            <div className="font-serif text-xl italic text-ink-2">
              <motion.span>{page}</motion.span> / {pad(list.length)}
            </div>
          </div>
        ) : (
          list.length > 1 && (
            <div className="mx-auto mt-2 max-w-[1320px] px-6 font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3 md:hidden">
              Swipe for more →
            </div>
          )
        )}
      </div>
    </section>
  )
}
