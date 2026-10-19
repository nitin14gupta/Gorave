'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { WHY } from '@/lib/founders'
import { Chapter } from '@/components/ui/atoms'

/** Chapter 03, why. Their reason, lit word by word as you scroll. */
export function Why() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] })
  const words = WHY.split(' ')
  return (
    <section className="bg-cream px-6 py-24 md:px-12 md:py-36 lg:px-20">
      <div className="mx-auto max-w-[1080px]">
        <Chapter n="03" title="Why we’re doing this" />
        <p ref={ref} className="mt-8 font-display text-[clamp(32px,4.6vw,72px)] font-extrabold leading-[1.04] tracking-[-0.05em]">
          {words.map((w, i) => (
            <Word key={i} p={p} at={i / words.length} span={1 / words.length}>{w}</Word>
          ))}
        </p>
      </div>
    </section>
  )
}

function Word({ children, p, at, span }: { children: string; p: MotionValue<number>; at: number; span: number }) {
  const opacity = useTransform(p, [at, at + span * 3], [0.14, 1])
  return <motion.span style={{ opacity }}>{children} </motion.span>
}
