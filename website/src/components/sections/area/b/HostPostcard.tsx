'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useMotionTemplate, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { AREA_SCENES, type Area } from '@/lib/area'
import { StoreBadges } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { CARD_SHADOW, Deckle, Grain, Postmark, SectionHead, Stamp, Tape } from './kit'

/**
 * Chapter 09, host from here. The doorway scene as one big postcard that
 * straightens up as it scrolls in; the door opens from a thin strip of warm
 * light to the full frame, and the note on the back writes itself.
 */
export function HostPostcard({ area }: { area: Area }) {
  const { city } = area
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const p = useSpring(scrollYProgress, { stiffness: 70, damping: 22 })
  const rotate = useTransform(p, [0, 1], [reduce ? -1.5 : -7, -1.5])
  const y = useTransform(p, [0, 1], [reduce ? 0 : 90, 0])
  // door: a sliver of warm light that opens to the full frame
  const side = useTransform(p, [0.2, 0.95], [reduce ? 0 : 46, 0])
  const clip = useMotionTemplate`inset(0% ${side}% 0% ${side}%)`
  const doorScale = useTransform(p, [0.2, 1], [reduce ? 1 : 1.22, 1])
  const light = useTransform(p, [0.2, 0.9], [1, 0])
  const note = `Your living room could be the next postcard from ${area.name}.`.split(' ')

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream px-6 py-28 md:px-20 md:py-36">
      <Deckle from="paper" seed={0} />
      <Grain />
      <div className="relative mx-auto max-w-[1220px]">
        <SectionHead n="09" label="Host from here" title="Open the door" serif={`in ${area.name}.`} />
        <motion.div style={{ rotate, y }} className={`relative mt-12 bg-white p-3 sm:p-5 ${CARD_SHADOW}`}>
          <Tape className="-top-3 left-1/2 -translate-x-1/2 -rotate-3" />
          <div className="grid gap-6 md:grid-cols-[0.92fr_1fr] md:gap-0">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#2a1a10]">
              <motion.div aria-hidden style={{ opacity: light }} className="absolute inset-y-0 left-1/2 w-[14%] -translate-x-1/2 bg-[#ffcf8a] blur-2xl" />
              <motion.div className="absolute inset-0 overflow-hidden" style={{ clipPath: clip }}>
                <motion.div className="absolute inset-0" style={{ scale: doorScale }}>
                  <Image src={AREA_SCENES.doorway} alt="A host opening her front door to two guests" fill sizes="(max-width: 768px) 92vw, 540px" className="object-cover" />
                  {/* a little paper tag tucked over the dessert box */}
                  <div className="absolute left-[56%] top-[43.5%] w-[24%] origin-top-left rotate-[-4deg]">
                    <div className="bg-paper px-2 py-2 text-center font-serif text-[clamp(11px,1.25vw,17px)] italic leading-tight text-ink shadow-[0_6px_14px_-6px_rgb(23_19_16/0.55)]">
                      dessert,<br />as promised
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            <div className="relative flex flex-col px-3 pb-4 md:border-l md:border-dashed md:border-ink/15 md:px-12 md:py-6">
              <div className="flex items-start justify-between gap-4">
                <Postmark top={`${area.name} · ${city.name}`} bottom="host here" center="yours?" className="w-[96px] -rotate-12 text-ink/50" />
                <Stamp className="w-[72px] rotate-6">
                  <div className="grid aspect-[4/5] place-items-center bg-brand px-1 text-center font-sans text-[9px] font-bold uppercase leading-snug tracking-[0.14em] text-white">Free<br />to<br />list</div>
                </Stamp>
              </div>

              <p className="mt-8 font-serif text-[clamp(32px,3.6vw,52px)] italic leading-[1.08] text-ink">
                {note.map((w, i) => (
                  <motion.span
                    key={i}
                    className="inline-block"
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '0px 0px -20% 0px' }}
                    transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 + i * 0.07 }}
                  >
                    {w}&nbsp;
                  </motion.span>
                ))}
              </p>
              <p className="mt-6 max-w-[440px] font-sans text-base leading-relaxed text-ink-2">
                List a house party, rooftop, game night or dinner party in a few minutes. Guests are phone-verified, you approve who comes, and the address stays private until they&apos;re in.
              </p>

              <div className="mt-auto space-y-4 pt-10">
                <div className="border-b border-ink/15 pb-1 font-serif text-xl italic text-ink-3">To: whoever&apos;s free on Saturday</div>
                <div className="border-b border-ink/15 pb-1 font-serif text-xl italic text-ink-3">{area.name}, {city.name}</div>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button href="/host" size="lg">Host in {area.name}</Button>
                <StoreBadges height={44} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
