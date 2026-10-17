'use client'

import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { HOST_NOTICES } from '@/lib/host'
import { Chapter } from '@/components/ui/atoms'
import { LockScreen } from '@/components/ui/LockScreen'
import { Phone } from '@/components/ui/Phone'

const CARDS = [
  { n: 'Edit', title: 'Plans change', body: 'Move the time, swap the venue details, change capacity. Everyone going and everyone who requested is notified.' },
  { n: 'Push', title: 'Requests reach you', body: 'Each join request lands as a push. Tap it, see the profile, decide.' },
  { n: 'Cancel', title: 'Calling it off', body: 'Cancel the event and everyone is told straight away, nobody turns up to a locked door.' },
]

/**
 * Chapter 06, after you hit publish. The phone rises out of the page and
 * stands up as you scroll, lock screen full of host pushes; the three
 * controls slide in from the right, one per beat.
 */
export function ControlRoom() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 24 })
  const rotateX = useTransform(p, [0, 1], [48, 0])
  const y = useTransform(p, [0, 1], [160, 0])
  const scale = useTransform(p, [0, 1], [0.82, 1])

  return (
    <section ref={ref} className="overflow-hidden bg-paper px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[auto_1fr]">
        <div className="order-2 flex justify-center lg:order-1" style={{ perspective: 1200 }}>
          <motion.div style={{ rotateX, y, scale, transformOrigin: '50% 100%' }}>
            <Phone width={280}>
              <LockScreen wallpaper="roof4" notices={HOST_NOTICES} />
            </Phone>
          </motion.div>
        </div>

        <div className="order-1 lg:order-2 lg:pl-10">
          <Chapter n="06" title="The control room" />
          <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Live doesn&apos;t mean<br />locked in.
          </h2>
          <div className="mt-10 grid gap-3">
            {CARDS.map((c, i) => (
              <motion.div
                key={c.n}
                initial={{ opacity: 0, x: 80 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.12 }}
                whileHover={{ x: -8 }}
                className="flex gap-5 rounded-[26px] bg-white p-6 shadow-soft"
              >
                <span className="w-16 shrink-0 font-serif text-2xl italic text-orange">{c.n}</span>
                <div>
                  <h3 className="font-display text-2xl font-extrabold tracking-[-0.03em]">{c.title}</h3>
                  <p className="mt-1 font-sans text-[15px] leading-relaxed text-ink-2">{c.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
