'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'

const BULBS = 22

function BulbRow({ vertical }: { vertical?: boolean }) {
  return (
    <div className={vertical ? 'flex h-full flex-col justify-between' : 'flex w-full justify-between'} aria-hidden>
      {Array.from({ length: vertical ? 8 : BULBS }, (_, i) => (
        <span
          key={i}
          className="size-2.5 rounded-full bg-gold shadow-[0_0_12px_3px_rgb(255_184_48/0.7)] md:size-3"
        />
      ))}
    </div>
  )
}

/**
 * Chapter 08, curtain call. A marquee sign framed in chasing bulbs; the
 * headline settles from wide-spaced to tight as it scrolls into place.
 */
export function CurtainCall() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const tracking = useTransform(scrollYProgress, [0, 1], ['0.08em', '-0.06em'])
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1])
  const glow = useTransform(scrollYProgress, [0.4, 1], [0, 1])

  return (
    <section ref={ref} className="overflow-hidden bg-noir px-4 py-24 text-noir-ink md:px-20 md:py-32">
      <motion.div style={{ scale }} className="relative mx-auto max-w-[1180px] rounded-[40px] bg-[radial-gradient(120%_90%_at_50%_0%,#3a1a14,#111_70%)] p-5 md:p-8">
        <div className="absolute inset-x-8 top-3 md:inset-x-12"><BulbRow /></div>
        <div className="absolute inset-x-8 bottom-3 md:inset-x-12"><BulbRow /></div>
        <div className="absolute inset-y-10 left-3"><BulbRow vertical /></div>
        <div className="absolute inset-y-10 right-3"><BulbRow vertical /></div>

        <div className="relative px-4 py-16 text-center md:px-10 md:py-24">
          <Chapter n="08" title="Curtain call" dark className="justify-center" />
          <motion.h2
            style={{ letterSpacing: tracking }}
            className="mt-6 font-display text-[clamp(48px,9vw,148px)] font-extrabold uppercase leading-[0.86]"
          >
            Doors open<br />
            <motion.span style={{ opacity: glow }} className="text-brand">when you say.</motion.span>
          </motion.h2>
          <p className="mx-auto mt-6 max-w-[480px] font-sans text-lg text-noir-ink-2">
            Free to list. Two free-entry events a month, or tickets from ₹99 with 90% to you. Your first night is a few minutes away.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Button href="/app" size="lg">Start hosting</Button>
            <StoreBadges height={48} />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
