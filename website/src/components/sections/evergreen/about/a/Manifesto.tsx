'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { AREA_SCENES } from '@/lib/area'
import { Chapter } from '@/components/ui/atoms'

const TEXT =
  'We think going out should be *easier,* *more* *social* and *safer.* Clubs sell you a queue and a cover charge. The nights you remember happen in people’s homes: a terrace, a living room, a dinner that ran late. So we put all of it in one link: the invite, the guest list, the money and the door.'

const WORDS = TEXT.split(' ').map(w => ({ text: w.replace(/\*/g, ''), hot: w.startsWith('*') }))

const PILLARS = [
  { n: '01', word: 'Easier', line: 'One link for the invite, the guest list, the money and the door. No spreadsheets, no cash at the gate.', img: AREA_SCENES.chai },
  { n: '02', word: 'More social', line: 'Rooms full of people who picked the same night as you. Come for the plan, stay for the late bite.', img: AREA_SCENES.latebite },
  { n: '03', word: 'Safer', line: 'Verified, 18+, private addresses and one-tap SOS. Built in from the first tap, not added later.', img: AREA_SCENES.doorway },
]

/**
 * Chapter 01, the manifesto. The why, read slowly: each word lights up as it
 * crosses the screen, and the three promises glow in brand once they're lit.
 * Below, the three words as cards; hover one and its picture slides out.
 */
export function Manifesto() {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.5'] })

  return (
    <section className="relative overflow-x-clip bg-paper px-6 py-28 md:px-20 md:py-40">
      <div className="mx-auto max-w-[1240px]">
        <Chapter n="01" title="The manifesto" />
        <p ref={ref} className="mt-10 font-display text-[clamp(32px,4.6vw,72px)] font-extrabold leading-[1.04] tracking-[-0.045em] text-ink">
          {WORDS.map((w, i) => (
            <Word key={i} p={scrollYProgress} from={i / WORDS.length} to={(i + 1) / WORDS.length} hot={w.hot} still={!!reduce}>
              {w.text}
            </Word>
          ))}
        </p>

        <div className="mt-20 grid gap-4 md:mt-28 md:grid-cols-3 md:gap-5">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.word}
              initial={reduce ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.1 }}
              className="group relative"
            >
              {/* the picture tucked behind the card, slides up and tilts out on hover */}
              <div
                aria-hidden
                className="pointer-events-none absolute right-6 top-0 hidden aspect-[4/5] w-[42%] overflow-hidden rounded-[18px] bg-white p-1.5 shadow-pop translate-y-[30px] transition-[translate,rotate] duration-700 ease-out-expo group-hover:-translate-y-[58%] group-hover:rotate-[7deg] md:block"
              >
                <div className="relative size-full overflow-hidden rounded-[13px]">
                  <Image src={p.img} alt="" fill sizes="220px" className="object-cover" />
                </div>
              </div>
              <div className="relative h-full rounded-[28px] bg-cream p-7 transition-[translate] duration-700 ease-out-expo md:p-8 md:group-hover:translate-y-2">
                <div className="font-serif text-2xl italic text-orange">{p.n}</div>
                <div className="mt-10 font-display text-[clamp(34px,3.4vw,48px)] font-extrabold leading-none tracking-[-0.05em] md:mt-16">{p.word}</div>
                <p className="mt-3 font-sans text-[17px] leading-relaxed text-ink-2">{p.line}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Word({ children, p, from, to, hot, still }: { children: string; p: MotionValue<number>; from: number; to: number; hot: boolean; still: boolean }) {
  const opacity = useTransform(p, [from, to], still ? [1, 1] : [0.14, 1])
  return (
    <motion.span style={{ opacity }} className={hot ? 'text-brand' : undefined}>
      {children}{' '}
    </motion.span>
  )
}
