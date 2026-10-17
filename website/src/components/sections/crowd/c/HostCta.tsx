'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { AREA_SCENES } from '@/lib/area'
import type { CrowdContent } from '@/lib/crowd'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { Magnetic } from './kit'

/**
 * Chapter 06, for hosts. A living-room photo grows from a framed card to
 * full bleed as it scrolls in; the buttons are magnetic.
 */
export function HostCta({ crowd, chapter = '06' }: { crowd: CrowdContent; chapter?: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] })
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.86, 1])
  const imgScale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 1.3, 1.05])
  const textY = useTransform(scrollYProgress, [0.3, 1], [reduce ? 0 : 80, 0])

  // "Hosting a girls' night? Pick women-only ..." splits into a question and an answer.
  const q = crowd.hostLine.indexOf('?')
  const ask = q > 0 ? crowd.hostLine.slice(0, q + 1) : crowd.hostLine
  const answer = q > 0 ? crowd.hostLine.slice(q + 1).trim() : ''

  return (
    <section ref={ref} className="bg-paper">
      <motion.div style={{ scale }} className="relative min-h-[100svh] overflow-hidden rounded-[36px] bg-noir text-noir-ink md:rounded-[48px]">
        <motion.div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${AREA_SCENES.livingroom})`, scale: imgScale }} />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-noir via-noir/65 to-noir/30" />
        <motion.div style={{ y: textY }} className="relative flex min-h-[100svh] flex-col justify-end px-6 pb-16 pt-28 md:px-20 md:pb-24">
          <div className="mx-auto w-full max-w-[1280px]">
            <Chapter n={chapter} title="For hosts" dark />
            <h2 className="mt-5 max-w-[1000px] font-display text-[clamp(48px,7.4vw,120px)] font-extrabold leading-[0.9] tracking-[-0.055em]">{ask}</h2>
            {answer && <p className="mt-6 max-w-[560px] font-sans text-xl leading-relaxed text-noir-ink/85">{answer}</p>}
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Magnetic>
                <Button href="/host" size="lg">Host a {crowd.label.toLowerCase()} night</Button>
              </Magnetic>
              <Magnetic strength={0.25}>
                <StoreBadges dark height={52} />
              </Magnetic>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
