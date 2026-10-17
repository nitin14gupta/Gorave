'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { Chapter } from '@/components/ui/atoms'

/**
 * The promise, read slowly. Each word of the hero line lights up as it
 * crosses the middle of the screen, like subtitles coming on.
 */
export function Statement({ line, label, chapter = '01' }: { line: string; label: string; chapter?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = line.split(' ')

  return (
    <section className="relative bg-paper px-6 py-28 text-ink md:px-20 md:py-44">
      <div className="mx-auto max-w-[1180px]">
        <Chapter n={chapter} title={`The ${label.toLowerCase()} promise`} />
        <p ref={ref} className="mt-10 font-display text-[clamp(34px,5.4vw,84px)] font-extrabold leading-[1.02] tracking-[-0.045em]">
          {words.map((w, i) => (
            <Word key={i} p={scrollYProgress} from={i / words.length} to={(i + 1) / words.length}>
              {w}
            </Word>
          ))}
        </p>
      </div>
    </section>
  )
}

function Word({ children, p, from, to }: { children: string; p: MotionValue<number>; from: number; to: number }) {
  const opacity = useTransform(p, [from, to], [0.14, 1])
  // The rule words (set, enforced, checked) get the brand gradient once lit.
  const hot = /^(set|enforced|checked|held|age-gated|app\.?|app;)/i.test(children)
  return (
    <motion.span style={{ opacity }} className={hot ? 'text-brand' : undefined}>
      {children}{' '}
    </motion.span>
  )
}
