'use client'

import { useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Poster } from '@/components/ui/Poster'
import { Button } from '@/components/ui/Button'
import { Chapter, StoreBadges } from '@/components/ui/atoms'

const EASE = [0.2, 0.8, 0.2, 1] as const
const TEMPLATES = ['houseparty', 'retro', 'nightout', 'beack', 'halloween', 'christmas'] as const

/**
 * Chapter 06, your turn. The app's real invite templates sit in a closed
 * hand; scroll lifts it into view, and hovering (or tapping) fans the cards
 * out so you can pick which night you'd throw first.
 */
export function HostCtaA({ firstGuide }: { firstGuide: string }) {
  const ref = useRef<HTMLElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [pinned, setPinned] = useState(false)
  const open = hover !== null || pinned
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const handY = useTransform(scrollYProgress, [0, 1], [160, 0])
  const handRotate = useTransform(scrollYProgress, [0, 1], [-14, 0])

  return (
    <section ref={ref} className="relative overflow-hidden bg-paper px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Chapter n="06" title="Your turn" />
          <h2 className="mt-4 font-display text-[clamp(48px,6.4vw,104px)] font-extrabold leading-[0.88] tracking-[-0.06em]">
            Your flat.<br />Your crowd.<br />
            <span className="font-serif font-normal italic tracking-[-0.02em] text-brand">Your night.</span>
          </h2>
          <p className="mt-6 max-w-[440px] font-sans text-lg leading-relaxed text-ink-2">
            Listing is free, and your first two free-entry events every month cost nothing. Pick a template, set the crowd, and open requests.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <Button href="/host" size="lg">Start hosting</Button>
            <Button href={firstGuide} kind="ghost" size="lg">Read the first guide</Button>
          </div>
          <div className="mt-8"><StoreBadges height={44} /></div>
        </div>

        <motion.div
          style={{ y: handY, rotate: handRotate }}
          className="relative mx-auto h-[300px] w-full max-w-[620px] scale-[0.55] sm:scale-90 md:h-[420px] md:scale-100"
          onClick={() => setPinned(v => !v)}
          onPointerLeave={() => setHover(null)}
        >
          {TEMPLATES.map((name, i) => {
            const k = i - (TEMPLATES.length - 1) / 2
            const lifted = hover === i
            return (
              <motion.div
                key={name}
                className="absolute bottom-0 left-1/2 -ml-[95px] origin-bottom cursor-pointer"
                style={{ zIndex: lifted ? 20 : 10 - Math.abs(Math.round(k)) }}
                animate={{
                  x: open ? k * 105 : k * 22,
                  y: (open ? Math.abs(k) * 22 : Math.abs(k) * 6) - (lifted ? 46 : 0),
                  rotate: open ? k * 9 : k * 4,
                  scale: lifted ? 1.06 : 1,
                }}
                transition={{ duration: 0.6, ease: EASE }}
                onPointerEnter={e => { if (e.pointerType === 'mouse') setHover(i) }}
              >
                <Poster poster={{ kind: 'template', name }} width={190} height={250} radius={18} className="shadow-pop" />
              </motion.div>
            )
          })}
          <div className="pointer-events-none absolute -bottom-12 inset-x-0 text-center font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">
            {open ? 'Real Gorave invite templates' : 'Hover or tap the hand'}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
