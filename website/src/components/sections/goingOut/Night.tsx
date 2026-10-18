'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { NIGHT_STAGES, outGuideHref, questionOf, stageGuides, type OutGuide } from '@/lib/goingOut'
import { cn } from '@/lib/cn'
import { Chapter } from '@/components/ui/atoms'
import { WomenTag, guidePhoto } from './kit'

// The light through the night: afternoon, golden hour, evening, late, morning.
const SKY = ['#f4ecdc', '#f8dcc0', '#f6cdb8', '#ebdde6', '#fbf7ef']

type Stage = { key: string; time: string; label: string; line: string; guides: OutGuide[] }

/**
 * Chapter 01, the night. The section pins and the evening slides past
 * sideways, 4 PM to the morning after, while the light changes behind it
 * and a sun crosses the bar at the top. Each stop is its questions, set
 * large; hover one and its cover and short answer follow the cursor.
 * "For women" lights up the women's guides. Phones get the stops stacked.
 */
export function Night() {
  const stages: Stage[] = NIGHT_STAGES.map(s => ({ key: s.key, time: s.time, label: s.label, line: s.line, guides: stageGuides(s.slugs) }))
  const [women, setWomen] = useState(false)
  const [hover, setHoverState] = useState<OutGuide | null>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 320, damping: 30 })
  const y = useSpring(my, { stiffness: 320, damping: 30 })
  // Appear right under the cursor, then follow it with a little spring.
  const setHover = (g: OutGuide | null) => {
    if (g && !hover) {
      x.jump(mx.get())
      y.jump(my.get())
    }
    setHoverState(g)
  }
  // Follow the cursor from the window, so moves over any layer count.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      mx.set(e.clientX)
      my.set(e.clientY)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [mx, my])

  const toggle = (
    <button
      type="button"
      onClick={() => setWomen(w => !w)}
      aria-pressed={women}
      className={cn('inline-flex items-center gap-3 rounded-full px-4 py-2 font-sans text-sm font-bold shadow-soft transition-colors duration-300', women ? 'bg-ink text-cream' : 'bg-white text-ink')}
    >
      <span className={cn('relative h-5 w-9 rounded-full transition-colors duration-300', women ? 'bg-orange' : 'bg-ink/15')}>
        <span className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-300 ease-out-expo', women ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </span>
      Guides for women
    </button>
  )

  return (
    <div>
      <Pinned stages={stages} women={women} toggle={toggle} onHover={setHover} />
      <Stacked stages={stages} women={women} toggle={toggle} />

      {/* The cover that follows the cursor, portalled so no transformed ancestor can offset it */}
      {typeof document !== 'undefined' && createPortal(<AnimatePresence>
        {hover && (
          <motion.div
            key="cover"
            aria-hidden
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.22 }}
            style={{ x, y }}
            className="pointer-events-none fixed left-0 top-0 z-[70] hidden md:block"
          >
            <div className="ml-6 mt-6 w-[260px] overflow-hidden rounded-[22px] bg-white shadow-pop">
              <div className="relative h-[150px]">
                <AnimatePresence initial={false}>
                  <motion.div key={hover.slug} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                    <Image src={guidePhoto(hover)} alt="" fill sizes="260px" className="object-cover" />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="p-4">
                <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-orange">The short answer</div>
                <p className="mt-1.5 font-sans text-[14px] leading-snug text-ink">{hover.takeaways[0]}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </div>
  )
}

function Pinned({ stages, women, toggle, onHover }: { stages: Stage[]; women: boolean; toggle: React.ReactNode; onHover: (g: OutGuide | null) => void }) {
  const ref = useRef<HTMLElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const reduce = !!useReducedMotion()
  const [dist, setDist] = useState(0)
  const [panel, setPanel] = useState(0)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(p, [0, 1], [0, -dist])
  const bg = useTransform(p, SKY.map((_, i) => i / (SKY.length - 1)), SKY)
  const sun = useTransform(p, [0, 1], ['0%', '100%'])

  useEffect(() => {
    const el = rail.current
    if (!el) return
    const measure = () => {
      setDist(Math.max(0, el.scrollWidth - window.innerWidth))
      setPanel((el.firstElementChild as HTMLElement | null)?.offsetWidth ?? 0)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (reduce) return <div className="hidden md:block"><Stacked stages={stages} women={women} toggle={toggle} always /></div>

  return (
    <motion.section ref={ref} style={{ backgroundColor: bg, height: `calc(100vh + ${dist}px)` }} className="relative hidden md:block">
      {/* Anchors for the hero's stop links, one per panel along the scroll */}
      {stages.map((s, i) => (
        <span key={s.key} data-night={s.key} aria-hidden className="absolute left-0" style={{ top: Math.min(i * panel, dist) }} />
      ))}
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-6 px-12 pt-24 lg:px-20">
          <Chapter n="01" title="The night, stop by stop" />
          {toggle}
        </div>
        {/* The sun crossing the night */}
        <div className="relative mx-12 mt-6 h-px bg-ink/15 lg:mx-20">
          <motion.span style={{ left: sun }} className="absolute -top-[7px] -ml-[7px] size-[15px] rounded-full bg-orange shadow-[0_0_0_6px_rgb(255_122_69/0.18)]" />
        </div>

        <motion.div ref={rail} style={{ x }} className="flex flex-1 items-center">
          {stages.map((s, i) => (
            <Panel key={s.key} s={s} n={i + 1} women={women} onHover={onHover} />
          ))}
        </motion.div>
      </div>
    </motion.section>
  )
}

function Panel({ s, n, women, onHover }: { s: Stage; n: number; women: boolean; onHover: (g: OutGuide | null) => void }) {
  return (
    <div className="grid w-[86vw] shrink-0 grid-cols-[minmax(260px,0.8fr)_1.4fr] items-center gap-12 px-12 lg:w-[78vw] lg:px-20">
      <div>
        <div className="font-serif text-2xl italic text-orange">{String(n).padStart(2, '0')}</div>
        <div className="mt-2 font-display text-[clamp(80px,10vw,176px)] font-extrabold leading-[0.82] tracking-[-0.07em]">{s.time}</div>
        <h2 className="mt-5 font-display text-[clamp(28px,2.8vw,44px)] font-extrabold tracking-[-0.045em]">{s.label}</h2>
        <p className="mt-2 max-w-[340px] font-sans text-[17px] leading-relaxed text-ink-2">{s.line}</p>
      </div>
      {/* Long stops split into two columns so they fit the screen */}
      <ul onMouseLeave={() => onHover(null)} className={s.guides.length > 6 ? 'grid grid-cols-2 gap-x-10 gap-y-1' : 'space-y-1'}>
        {s.guides.map(g => <Question key={g.slug} g={g} women={women} onHover={onHover} compact={s.guides.length > 6} />)}
      </ul>
    </div>
  )
}

function Question({ g, women, onHover, compact }: { g: OutGuide; women: boolean; onHover?: (g: OutGuide | null) => void; compact?: boolean }) {
  const lit = !women || g.collection === 'women'
  return (
    <li>
      <Link
        href={outGuideHref(g)}
        onMouseEnter={() => onHover?.(g)}
        onFocus={() => onHover?.(g)}
        onBlur={() => onHover?.(null)}
        className="group block py-1.5 transition-opacity duration-500"
        style={{ opacity: lit ? 1 : 0.18 }}
      >
        <span className={cn('inline font-display font-extrabold leading-[1.12] tracking-[-0.045em] transition-colors duration-500 group-hover:text-orange', compact ? 'text-[clamp(18px,1.65vw,27px)]' : 'text-[clamp(22px,2.5vw,40px)]')}>
          {questionOf(g)}
        </span>
        <span className="ml-2.5 inline-flex translate-y-[-0.2em] items-center gap-1.5 align-middle font-sans text-xs font-bold text-ink-3">
          {g.collection === 'women' && <WomenTag />}
          {g.readMinutes} min
          <span aria-hidden className="text-ink opacity-0 transition-[opacity,transform] duration-500 group-hover:translate-x-1 group-hover:opacity-100">→</span>
        </span>
      </Link>
    </li>
  )
}

function Stacked({ stages, women, toggle, always }: { stages: Stage[]; women: boolean; toggle: React.ReactNode; always?: boolean }) {
  return (
    <section className={cn('bg-paper px-6 py-20', !always && 'md:hidden')}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Chapter n="01" title="The night, stop by stop" />
        {toggle}
      </div>
      {stages.map((s, i) => (
        <div key={s.key} data-night={s.key} className="mt-14 scroll-mt-20">
          <div className="font-serif text-lg italic text-orange">{String(i + 1).padStart(2, '0')}</div>
          <div className="font-display text-[64px] font-extrabold leading-[0.85] tracking-[-0.065em]">{s.time}</div>
          <h2 className="mt-3 font-display text-[28px] font-extrabold tracking-[-0.04em]">{s.label}</h2>
          <ul className="mt-5 border-t border-ink/12">
            {s.guides.map(g => (
              <li key={g.slug} className="border-b border-ink/12">
                <Link href={outGuideHref(g)} className="flex items-baseline justify-between gap-4 py-3.5 transition-opacity" style={{ opacity: !women || g.collection === 'women' ? 1 : 0.25 }}>
                  <span className="font-display text-[21px] font-extrabold leading-snug tracking-[-0.035em]">{questionOf(g)}</span>
                  <span className="shrink-0 font-sans text-xs font-bold text-ink-3">{g.readMinutes} min</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
