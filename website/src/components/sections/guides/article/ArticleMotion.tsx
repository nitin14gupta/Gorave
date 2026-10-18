'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { PHOTOS } from '@/constants'
import type { HostGuide } from '@/lib/hostGuides'

/** What the article pieces need from any guide (hosting, going-out or women's). */
export type ArticleMeta = Pick<HostGuide, 'title' | 'dek' | 'readMinutes' | 'hero'> & { category: string }
import type { Crumb } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const

/** Thin brand bar across the top of the window that fills as you read. */
export function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.3 })
  return <motion.div aria-hidden style={{ scaleX }} className="fixed inset-x-0 top-0 z-[70] h-[4px] origin-left bg-brand" />
}

/** Full-bleed photo that sinks slower than the page while the headline lifts away. */
export function ArticleHero({ guide, crumbs, kicker = 'Gorave hosting guide' }: { guide: ArticleMeta; crumbs: Crumb[]; kicker?: string }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '28%'])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.18])
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  return (
    <section ref={ref} className="relative flex min-h-[88svh] flex-col overflow-hidden bg-paper text-white">
      <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0">
        <Image src={PHOTOS[guide.hero]} alt="" fill preload sizes="100vw" className="object-cover" />
      </motion.div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/45" />

      <motion.div style={{ y: textY, opacity: fade }} className="relative z-10 flex flex-1 flex-col px-6 pb-14 pt-28 md:px-20">
        <Breadcrumbs crumbs={crumbs} className="text-white/70 [&_[aria-current]]:text-white [&_a:hover]:text-white" />
        <div className="mx-auto mt-auto w-full max-w-[1180px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="flex flex-wrap items-center gap-3 font-sans text-xs font-bold uppercase tracking-[0.16em] text-white/80"
          >
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{guide.category}</span>
            <span>{guide.readMinutes} min read</span>
            <span>·</span>
            <span>{kicker}</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.08 }}
            className="mt-5 max-w-[1000px] font-display text-[clamp(44px,7vw,112px)] font-extrabold leading-[0.88] tracking-[-0.06em]"
          >
            {guide.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 0.2 }}
            className="mt-6 max-w-[620px] font-serif text-[clamp(22px,2.2vw,30px)] italic leading-snug text-white/85"
          >
            {guide.dek}
          </motion.p>
        </div>
      </motion.div>
    </section>
  )
}

/** Sticky contents list; the section you're reading is highlighted and its marker slides to it. */
export function Toc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id)

  useEffect(() => {
    const els = items.map(i => document.getElementById(i.id)).filter((el): el is HTMLElement => !!el)
    const io = new IntersectionObserver(
      entries => {
        const hit = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (hit) setActive(hit.target.id)
      },
      { rootMargin: '-25% 0px -65% 0px' },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [items])

  return (
    <nav aria-label="In this guide" className="sticky top-28">
      <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">In this guide</div>
      <ol className="relative mt-4 border-l-[1.5px] border-ink/10">
        {items.map((it, i) => {
          const on = it.id === active
          return (
            <li key={it.id} className="relative">
              {on && <motion.span layoutId="guide-toc-marker" className="absolute -left-[1.5px] top-0 h-full w-[3px] rounded-full bg-brand" transition={{ duration: 0.45, ease: EASE }} />}
              <a
                href={`#${it.id}`}
                className={cn('flex gap-3 py-2 pl-4 font-sans text-[15px] leading-snug transition-colors', on ? 'font-bold text-ink' : 'text-ink-3 hover:text-ink')}
              >
                <span className="font-serif italic text-orange">{String(i + 1).padStart(2, '0')}</span>
                {it.label}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** "Read next"the photo slides in from the side as the card scrolls up, and zooms on hover. */
export function NextGuideCard({ guide, href }: { guide: ArticleMeta; href: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const clip = useTransform(scrollYProgress, [0, 1], ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'])
  const x = useTransform(scrollYProgress, [0, 1], [60, 0])

  return (
    <Link ref={ref} href={href} className="group grid overflow-hidden rounded-[32px] bg-paper shadow-soft transition-shadow duration-500 hover:shadow-pop md:grid-cols-[1fr_1.1fr]">
      <motion.div style={{ x }} className="flex flex-col justify-between gap-10 p-8 md:p-12">
        <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">Read next · {guide.category}</div>
        <div>
          <div className="font-display text-[clamp(32px,4vw,56px)] font-extrabold leading-[0.92] tracking-[-0.05em]">{guide.title}</div>
          <p className="mt-4 max-w-[440px] font-sans text-lg leading-relaxed text-ink-2">{guide.dek}</p>
        </div>
        <div className="flex items-center gap-3 font-sans text-sm font-bold">
          <span className="grid size-11 place-items-center rounded-full bg-ink text-cream transition-transform duration-500 ease-out-expo group-hover:translate-x-2 group-hover:bg-coral">→</span>
          {guide.readMinutes} min read
        </div>
      </motion.div>
      <motion.div style={{ clipPath: clip }} className="relative min-h-[280px] overflow-hidden">
        <Image src={PHOTOS[guide.hero]} alt="" fill sizes="(min-width: 768px) 640px, 100vw" className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.07]" />
      </motion.div>
    </Link>
  )
}
