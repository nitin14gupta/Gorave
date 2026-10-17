'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform } from 'motion/react'
import { PHOTOS } from '@/constants'
import { guideHref, type HostGuide } from '@/lib/hostGuides'
import { Chapter } from '@/components/ui/atoms'

/**
 * Chapter 01, the cover story. The photo opens out from a narrow slot as it
 * reaches you, then drifts slower than the page; the headline slides the
 * other way, so the spread feels printed in two layers.
 */
export function Featured({ guide }: { guide: HostGuide }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const inset = useTransform(scrollYProgress, [0.05, 0.4], [14, 0])
  const radius = useTransform(scrollYProgress, [0.05, 0.4], [80, 32])
  const clip = useMotionTemplate`inset(${inset}% ${inset}% ${inset}% ${inset}% round ${radius}px)`
  const imgY = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])
  const titleY = useTransform(scrollYProgress, [0, 1], [90, -90])
  const sticker = useTransform(scrollYProgress, [0, 1], [-18, 22])

  return (
    <section ref={ref} className="relative overflow-hidden bg-paper px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Chapter n="01" title="The cover story" />
            <h2 className="mt-4 max-w-[760px] font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              Start with the night<br />
              <span className="font-serif font-normal italic tracking-[-0.02em] text-brand">everyone remembers.</span>
            </h2>
          </div>
          <p className="max-w-[340px] font-sans text-lg leading-relaxed text-ink-2">If you only read one guide before your first party, make it this one.</p>
        </div>

        <Link href={guideHref(guide.slug)} className="group relative mt-12 block">
          <motion.div style={{ clipPath: clip }} className="relative aspect-[4/5] overflow-hidden bg-tile sm:aspect-[16/10] md:aspect-[16/8]">
            <motion.div style={{ y: imgY }} className="absolute inset-[-14%_0]">
              <Image
                src={PHOTOS[guide.hero]}
                alt={guide.title}
                fill
                sizes="(min-width: 1280px) 1280px, 100vw"
                className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.04]"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <motion.div style={{ y: titleY }} className="absolute inset-x-0 bottom-0 p-6 text-white md:p-12">
              <div className="flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-[0.16em] text-white/80">
                <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{guide.category}</span>
                {guide.readMinutes} min read
              </div>
              <h3 className="mt-4 max-w-[900px] font-display text-[clamp(36px,6vw,96px)] font-extrabold leading-[0.88] tracking-[-0.055em]">{guide.title}</h3>
              <p className="mt-4 max-w-[560px] font-sans text-lg leading-relaxed text-white/80">{guide.dek}</p>
            </motion.div>
          </motion.div>

          <motion.div
            style={{ rotate: sticker }}
            className="absolute -top-6 right-4 grid size-28 place-items-center rounded-full bg-brand text-center font-display text-sm font-extrabold uppercase leading-tight tracking-[-0.01em] text-white shadow-pop transition-transform duration-500 ease-out-expo group-hover:scale-110 md:right-10 md:size-36 md:text-base"
          >
            Start<br />here →
          </motion.div>
        </Link>
      </div>
    </section>
  )
}
