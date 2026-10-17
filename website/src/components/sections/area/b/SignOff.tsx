'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { cityStreet, type Area } from '@/lib/area'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { CARD_SHADOW, Deckle, Grain, Postmark, Stamp, WAVES } from './kit'

const FACE = 'absolute inset-0 bg-white p-3 sm:p-4 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]'

/**
 * "Wish you were here."the last postcard. Its front is the city street;
 * as it scrolls to the middle of the screen it turns over in 3D to show the
 * back: the note, the sign-off, the address lines and the way out. Tap (or
 * the button) turns it again.
 */
export function SignOff({ area }: { area: Area }) {
  const { city } = area
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const [turned, setTurned] = useState(false)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const p = useSpring(scrollYProgress, { stiffness: 60, damping: 20 })
  const flip = useTransform(p, [0.45, 0.95], reduce ? [180, 180] : [0, 180])
  const lift = useTransform(p, [0.45, 0.7, 0.95], reduce ? [1, 1, 1] : [1, 1.04, 1])
  const tilt = useTransform(p, [0, 1], reduce ? [-1.5, -1.5] : [-5, -1.5])

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream px-4 py-28 sm:px-6 md:px-20 md:py-36">
      <Deckle from="paper" seed={2} />
      <Grain />
      <div className="relative mx-auto max-w-[980px]">
        <div className="[perspective:1800px]">
          <motion.div style={{ rotateY: flip, scale: lift, rotate: tilt, transformStyle: 'preserve-3d' }}>
            <motion.div
              animate={{ rotateY: turned ? 180 : 0 }}
              transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 60, damping: 14 }}
              onClick={e => { if (!(e.target as HTMLElement).closest('a')) setTurned(t => !t) }}
              className="relative aspect-[4/5] cursor-pointer sm:aspect-[3/2]"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* front */}
              <div className={cn(FACE, CARD_SHADOW)}>
                <div className="relative size-full overflow-hidden">
                  <Image src={cityStreet(city.slug)} alt={`A street in ${city.name} at blue hour`} fill sizes="(max-width: 1024px) 94vw, 980px" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
                  <div className="absolute inset-x-5 bottom-5 text-white sm:inset-x-8 sm:bottom-7">
                    <div className="font-serif text-xl italic opacity-90 sm:text-2xl">Greetings from</div>
                    <div className="font-display text-[clamp(52px,9vw,128px)] font-extrabold leading-[0.85] tracking-[-0.06em]">{area.name}</div>
                  </div>
                </div>
              </div>

              {/* back */}
              <div className={cn(FACE, CARD_SHADOW, 'p-5 sm:p-8 md:p-10')} style={{ transform: 'rotateY(180deg)' }}>
                <div className="grid h-full gap-6 sm:grid-cols-[1.3fr_1fr] sm:gap-0">
                  <div className="flex flex-col sm:pr-8">
                    <h2 className="font-serif text-[clamp(46px,7vw,100px)] italic leading-[0.92] tracking-[-0.02em] text-ink">
                      Wish you were <span className="text-brand">here.</span>
                    </h2>
                    <p className="mt-4 font-serif text-2xl italic text-ink-2 sm:text-3xl">Love, {area.name} <span className="text-orange">x</span></p>
                    <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
                      <Button href={`/${city.slug}`}>Find a night in {city.name}</Button>
                      <Button href="/host" kind="ghost">Host one</Button>
                    </div>
                  </div>
                  <div className="relative hidden flex-col border-l border-dashed border-ink/15 pl-8 sm:flex">
                    <div className="flex items-start justify-end gap-1">
                      <div className="relative w-[88px] text-ink/45">
                        <Postmark top={`${area.name} · ${city.name}`} bottom={city.coords} center={<>see you<br />soon</>} className="w-full -rotate-12" />
                        <svg viewBox="0 0 180 48" className="absolute right-[60%] top-[30%] w-[130%]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                          {WAVES.map(d => <path key={d} d={d} />)}
                        </svg>
                      </div>
                      <Stamp className="w-[66px] rotate-3">
                        <div className="relative aspect-[4/5] overflow-hidden">
                          <Image src={cityStreet(city.slug)} alt="" fill sizes="66px" className="object-cover" style={{ objectPosition: '25% 50%' }} />
                        </div>
                      </Stamp>
                    </div>
                    <div className="mt-auto space-y-4">
                      <div className="border-b border-ink/20 pb-1 font-serif text-2xl italic text-ink">To: you</div>
                      <div className="border-b border-ink/20 pb-1 font-serif text-xl italic text-ink-2">wherever you are tonight</div>
                      <div className="border-b border-ink/20 pb-1 font-serif text-xl italic text-ink-2">{city.name}, {city.state}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
        {/* <div className="mt-10 text-center">
          <button type="button" onClick={() => setTurned(t => !t)} className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3 transition-colors hover:text-ink">
            Turn the card over ↻
          </button>
        </div> */}
      </div>
    </section>
  )
}
