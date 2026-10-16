'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react'
import { PHOTOS } from '@/constants'
import { GUIDE_CATEGORIES, guideHref, type GuideCategory, type HostGuide } from '@/lib/hostGuides'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const
type Filter = 'All' | GuideCategory

/**
 * Chapter 02 — the contents page. Pick a section of the magazine and the
 * grid reshuffles itself (motion layout); every card tilts toward the cursor
 * and slides its standfirst up on hover.
 */
export function GuideIndex({ guides }: { guides: HostGuide[] }) {
  const [filter, setFilter] = useState<Filter>('All')
  const shown = filter === 'All' ? guides : guides.filter(g => g.category === filter)
  const filters: Filter[] = ['All', ...GUIDE_CATEGORIES]
  const countOf = (f: Filter) => (f === 'All' ? guides.length : guides.filter(g => g.category === f).length)

  return (
    <section id="guides" className="bg-cream px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Chapter n="02" title="The contents" />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-8">
          <h2 className="font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Pick your<br />problem.
          </h2>
          <div role="group" aria-label="Filter guides by category" className="flex flex-wrap gap-1.5 rounded-full bg-paper p-1.5 shadow-soft">
            {filters.map(f => {
              const active = f === filter
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f)}
                  className={cn('relative rounded-full px-4 py-2 font-sans text-sm font-bold transition-colors', active ? 'text-cream' : 'text-ink-2 hover:text-ink')}
                >
                  {active && <motion.span layoutId="guides-a-filter" className="absolute inset-0 rounded-full bg-ink" transition={{ duration: 0.5, ease: EASE }} />}
                  <span className="relative">
                    {f} <span className={cn('ml-0.5 font-serif italic', active ? 'text-gold' : 'text-ink-3')}>{countOf(f)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <motion.div layout className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map(g => (
              <motion.div
                key={g.slug}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25 } }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <TiltCard guide={g} n={guides.indexOf(g) + 1} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

function TiltCard({ guide, n }: { guide: HostGuide; n: number }) {
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [8, -8]), { stiffness: 180, damping: 18 })
  const ry = useSpring(useTransform(px, [0, 1], [-10, 10]), { stiffness: 180, damping: 18 })
  const gx = useTransform(px, v => `${v * 100}%`)
  const gy = useTransform(py, v => `${v * 100}%`)
  const glare = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgb(255 255 255 / 0.35), transparent 55%)`

  function onMove(e: React.PointerEvent<HTMLAnchorElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  function onLeave() {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <Link href={guideHref(guide.slug)} onPointerMove={onMove} onPointerLeave={onLeave} className="group block [perspective:1000px]">
      <motion.article style={{ rotateX: rx, rotateY: ry }} className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-tile shadow-soft transition-shadow duration-500 [transform-style:preserve-3d] group-hover:shadow-pop">
        <Image src={PHOTOS[guide.hero]} alt="" fill sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
        <motion.div aria-hidden style={{ backgroundImage: glare }} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute inset-x-5 top-5 flex items-center justify-between font-sans text-xs font-bold uppercase tracking-[0.14em] text-white/85">
          <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">{guide.category}</span>
          <span className="font-serif text-2xl normal-case italic tracking-normal">{String(n).padStart(2, '0')}</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6 text-white" style={{ transform: 'translateZ(40px)' }}>
          <h3 className="font-display text-[clamp(26px,2.4vw,34px)] font-extrabold leading-[0.95] tracking-[-0.04em]">{guide.title}</h3>
          <div className="grid transition-[grid-template-rows,opacity] duration-500 ease-out-expo [@media(hover:hover)]:grid-rows-[0fr] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:grid-rows-[1fr] [@media(hover:hover)]:group-hover:opacity-100">
            <p className="overflow-hidden pt-3 font-sans text-[15px] leading-relaxed text-white/80">{guide.dek}</p>
          </div>
          <div className="mt-4 flex items-center justify-between font-sans text-sm font-bold text-white/75">
            <span>{guide.readMinutes} min read</span>
            <span className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">Read →</span>
          </div>
        </div>
      </motion.article>
    </Link>
  )
}
