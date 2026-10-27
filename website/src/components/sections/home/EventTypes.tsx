'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLayoutEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { EVENT_TYPES, PHOTOS } from '@/constants'
import { cn } from '@/lib/cn'
import { Eyebrow, H2 } from '@/components/ui/atoms'

/**
 * Horizontal scroll driven by vertical scroll: the section pins and the card
 * track slides sideways by exactly its overflow, then the page continues.
 */
export function EventTypes() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState(0)

  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current
      if (track) setOverflow(Math.max(0, track.scrollWidth - window.innerWidth))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const x = useSpring(useTransform(scrollYProgress, [0, 1], [0, -overflow]), { stiffness: 140, damping: 30 })

  return (
    <section ref={sectionRef} className="relative bg-cream" style={{ height: `calc(100vh + ${overflow}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center-safe overflow-hidden pt-24">
        <div className="mx-auto mb-11 flex w-full max-w-[1280px] items-end justify-between px-6 md:px-20">
          <div>
            <Eyebrow>A million reasons to hang</Eyebrow>
            <H2 className="mt-3.5">Pick your kind<br />of night.</H2>
          </div>
          <Link href="/events" className="hidden font-sans text-[15px] font-bold underline-offset-4 hover:underline md:block">Browse every type →</Link>
        </div>
        <motion.div ref={trackRef} style={{ x }} className="flex w-max gap-5.5 px-6 md:px-20">
          {EVENT_TYPES.map((t, i) => (
            <Link
              key={t.key}
              href={`/${t.slug}`}
              className={cn(
                'group relative block h-[min(480px,58vh)] w-[min(340px,78vw)] shrink-0 overflow-hidden rounded-[32px] transition-transform duration-500 ease-out-expo hover:-translate-y-1.5',
                i % 2 === 1 && 'md:translate-y-10 md:hover:translate-y-8.5',
              )}
            >
              <Image src={PHOTOS[t.photo]} alt={t.label} fill sizes="(max-width: 768px) 80vw, 680px" className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]" />
              <div className={cn('absolute inset-x-3.5 bottom-3.5 rounded-[22px] p-4.5', t.tint, t.ink)}>
                <div className="font-display text-[26px] font-extrabold tracking-[-0.03em]">{t.label}</div>
                <div className="mt-1 font-sans text-sm opacity-80">{t.blurb}</div>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
