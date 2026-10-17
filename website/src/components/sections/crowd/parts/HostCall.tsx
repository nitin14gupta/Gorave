'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import type { CrowdViewProps } from '../types'
import { StoreBadges } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { EASE, Head } from './kit'

const ORDER = ['women-only', 'balanced-crowd', '21-plus', '25-plus']

/**
 * Chapter 06, host one. The crowd photo leans back as you scroll in and a
 * "new event" card slides over it; this crowd's switch flips on once the
 * card is in view. Hover the other rows to see them light up.
 */
export function HostCall({ crowd, place, others }: Pick<CrowdViewProps, 'crowd' | 'place' | 'others'>) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const inView = useInView(card, { once: true, amount: 0.6 })
  const [hover, setHover] = useState<string | null>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const p = useSpring(scrollYProgress, { stiffness: 70, damping: 22 })
  const rotate = useTransform(p, [0, 1], reduce ? [-4, -4] : [-12, -4])
  const y = useTransform(p, [0, 1], reduce ? [0, 0] : [80, 0])
  const cardY = useTransform(p, [0, 1], reduce ? [0, 0] : [140, 0])

  const rows = [{ slug: crowd.slug, label: crowd.label, promise: crowd.promise }, ...others.map(o => ({ slug: o.slug, label: o.label, promise: o.promise }))]
    .sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug))

  return (
    <section ref={ref} className="overflow-hidden bg-paper px-6 py-24 text-ink md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-[1fr_1fr]">
        <div>
          <Head n="07" label="Host one" title="Hosting one?" serif="It’s one setting." />
          <p className="mt-6 max-w-[460px] font-sans text-xl leading-relaxed text-ink-2">{crowd.hostLine}</p>
          <p className="mt-4 max-w-[460px] font-sans text-base leading-relaxed text-ink-2/80">
            List it from your home in {place.name === 'India' ? 'any of our cities' : place.name}. You approve who comes on free nights, and the address stays private until guests are confirmed.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button href="/host" size="lg">Host a {crowd.label.toLowerCase()} night</Button>
            <StoreBadges height={44} />
          </div>
        </div>

        <div className="relative mx-auto h-[520px] w-full max-w-[520px] sm:h-[560px]">
          <motion.div style={{ rotate, y }} className="absolute right-0 top-0 h-[78%] w-[72%] overflow-hidden rounded-[28px] shadow-pop">
            <Image src={crowd.image} alt="" fill sizes="380px" className="object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>
          <motion.div ref={card} style={{ y: cardY }} className="absolute bottom-0 left-0 w-[86%] max-w-[400px] rounded-[26px] bg-paper p-5 text-ink shadow-pop">
            <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">New event</div>
            <div className="mt-1 font-display text-2xl font-extrabold tracking-[-0.035em]">Who&apos;s it for?</div>
            <ul className="mt-4 grid gap-1.5" onMouseLeave={() => setHover(null)}>
              {rows.map(r => {
                const current = r.slug === crowd.slug
                const on = current ? inView || !!reduce : hover === r.slug
                return (
                  <li
                    key={r.slug}
                    onMouseEnter={() => setHover(r.slug)}
                    className={cn('flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-300', on ? 'bg-white shadow-soft' : '')}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-sans text-[15px] font-bold">{r.label}</div>
                      <div className="truncate font-sans text-xs text-ink-3">{r.promise}</div>
                    </div>
                    <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors duration-500', on ? 'bg-brand' : 'bg-ink/15')}>
                      <motion.span
                        className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow"
                        animate={{ x: on ? 20 : 0 }}
                        transition={{ duration: 0.45, ease: EASE, delay: current && !hover ? 0.3 : 0 }}
                      />
                    </span>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
