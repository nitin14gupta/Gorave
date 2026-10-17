'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { AREA_SCENES } from '@/lib/area'
import type { SiteStats } from '@/lib/pagesData'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { ABOUT_CRUMBS, Ctas, EASE, statItems } from '../shared'

type Piece = { w: string } | { img: string; width: number; rotate: number; zoom?: boolean; label: string }

// The line, word by word, with pictures blooming open between the words.
const LINE_RAW: { pieces: Piece[]; brand?: boolean }[] = [
  { pieces: [{ w: 'The' }, { w: 'best' }, { w: 'nights' }, { img: AREA_SCENES.rooftop, width: 1.5, rotate: -4, label: 'rooftop' }] },
  { pieces: [{ w: 'happen' }, { w: 'at' }, { img: AREA_SCENES.doorway, width: 1.15, rotate: 3, label: 'the door' }] },
  { pieces: [{ w: 'someone’s' }, { img: AREA_SCENES.livingroom, width: 1.7, rotate: 0, zoom: true, label: 'the living room' }, { w: 'place.' }], brand: true },
]

// Each piece's entrance delay, in reading order.
const LINE = LINE_RAW.map((row, ri) => ({
  ...row,
  pieces: row.pieces.map((pc, pi) => ({ pc, delay: 0.12 + (LINE_RAW.slice(0, ri).reduce((n, r) => n + r.pieces.length, 0) + pi) * 0.08 })),
}))

/**
 * "The best nights happen at someone's place." The line rises in word by
 * word while photos bloom open between the words. Scroll, and the living
 * room in the last line opens up until it fills the screen.
 */
export function Hero({ stats }: { stats: SiteStats }) {
  const reduce = useReducedMotion()
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const pill = useRef<HTMLSpanElement>(null)

  // Pill rect relative to the stage, kept in motion values (no re-renders).
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const rw = useMotionValue(0)
  const rh = useMotionValue(0)
  const sw = useMotionValue(0)
  const sh = useMotionValue(0)

  useEffect(() => {
    if (reduce) return
    const measure = () => {
      const s = stage.current?.getBoundingClientRect()
      const p = pill.current?.getBoundingClientRect()
      if (!s || !p) return
      rx.set(p.left - s.left)
      ry.set(p.top - s.top)
      rw.set(p.width)
      rh.set(p.height)
      sw.set(s.width)
      sh.set(s.height)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (pill.current) ro.observe(pill.current)
    if (stage.current) ro.observe(stage.current)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [reduce, rx, ry, rw, rh, sw, sh])

  const { scrollYProgress: p } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const t = useTransform(p, [0.04, 0.58], [0, 1], { ease: v => 1 - Math.pow(1 - v, 3) })
  const left = useTransform([t, rx], ([v, x]: number[]) => x * (1 - v))
  const top = useTransform([t, ry], ([v, y]: number[]) => y * (1 - v))
  const width = useTransform([t, rw, sw], ([v, w, s]: number[]) => w + (s - w) * v)
  const height = useTransform([t, rh, sh], ([v, h, s]: number[]) => h + (s - h) * v)
  const radius = useTransform([t, rh], ([v, h]: number[]) => (h / 2) * (1 - v))
  const shown = useTransform([t, rw], ([v, w]: number[]) => (v > 0.002 && w > 0 ? 1 : 0))
  const textFade = useTransform(p, [0.02, 0.3], [1, 0])
  const shade = useTransform(p, [0.5, 0.7], [0, 1])
  const lineY = useTransform(p, [0.58, 0.78], [40, 0])
  const lineO = useTransform(p, [0.58, 0.76], [0, 1])
  const imgScale = useTransform(p, [0.5, 1], [1, 1.06])

  const facts = statItems(stats)

  return (
    <section ref={section} className="relative bg-cream" style={{ height: reduce ? 'auto' : '240vh' }}>
      <div ref={stage} className={reduce ? 'relative' : 'sticky top-0 h-[100svh] overflow-hidden'}>
        <motion.div
          style={{ opacity: reduce ? 1 : textFade }}
          className="mx-auto flex h-full max-w-[1400px] flex-col justify-center px-6 pb-12 pt-28 md:px-12 lg:px-20"
        >
          <Breadcrumbs crumbs={ABOUT_CRUMBS} />
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="mt-7 font-serif text-2xl italic text-ink-2"
          >
            Why we exist
          </motion.div>
          <h1 className="mt-2 font-display text-[clamp(46px,8.2vw,136px)] font-extrabold leading-[0.96] tracking-[-0.055em] text-ink">
            {LINE.map((row, ri) => (
              <span key={ri} className="md:block">
                {row.pieces.map(({ pc, delay }, pi) => {
                  if ('w' in pc) return <Word key={pi} text={pc.w} delay={delay} brand={row.brand && pc.w === 'place.'} reduce={!!reduce} />
                  return (
                    <Pill key={pi} piece={pc} delay={delay + 0.15} reduce={!!reduce} pillRef={pc.zoom ? pill : undefined} />
                  )
                })}
              </span>
            ))}
          </h1>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 1.25 }}
            className="mt-9 grid gap-8 md:grid-cols-[minmax(0,520px)_auto] md:items-end md:justify-between"
          >
            <div>
              <p className="max-w-[520px] font-sans text-lg leading-relaxed text-ink-2 md:text-xl">
                Not the club with the cover charge. The rooftop, the living room, the table that ran late. Gorave is how you find those nights, and how you host your own.
              </p>
              {facts.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 font-sans text-sm font-bold text-ink-3">
                  {facts.slice(0, 2).map(f => (
                    <span key={f.label}><span className="text-ink">{f.value}</span> {f.label}</span>
                  ))}
                </div>
              )}
            </div>
            <Ctas />
          </motion.div>
        </motion.div>

        {!reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute z-10 overflow-hidden"
            style={{ left, top, width, height, borderRadius: radius, opacity: shown }}
          >
            <motion.div style={{ scale: imgScale }} className="absolute inset-0">
              <Image src={AREA_SCENES.livingroom} alt="" fill sizes="100vw" className="object-cover" />
            </motion.div>
            <motion.div style={{ opacity: shade }} className="absolute inset-0 bg-gradient-to-t from-[#1d130c]/75 via-[#1d130c]/25 to-transparent" />
            <motion.div style={{ opacity: lineO, y: lineY }} className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-6 pb-14 md:px-12 md:pb-20 lg:px-20">
              <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-cream/80">Fig. 01 · A Saturday, somewhere in your city</div>
              <p className="mt-4 max-w-[980px] font-display text-[clamp(36px,5.4vw,84px)] font-extrabold leading-[0.95] tracking-[-0.05em] text-cream">
                No queue. No cover charge. <span className="font-serif font-normal italic tracking-[-0.02em]">Just someone’s place, and the people in it.</span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  )
}

function Word({ text, delay, brand, reduce }: { text: string; delay: number; brand?: boolean; reduce: boolean }) {
  return (
    <>
      <span className="inline-block overflow-hidden pb-[0.1em] align-bottom">
        <motion.span
          className={brand ? 'inline-block text-brand' : 'inline-block'}
          initial={reduce ? false : { y: '110%' }}
          animate={{ y: '0%' }}
          transition={{ duration: 0.9, ease: EASE, delay }}
        >
          {text}
        </motion.span>
      </span>{' '}
    </>
  )
}

function Pill({ piece, delay, reduce, pillRef }: {
  piece: Extract<Piece, { img: string }>
  delay: number
  reduce: boolean
  pillRef?: React.RefObject<HTMLSpanElement | null>
}) {
  return (
    <>
      <motion.span
        ref={pillRef}
        aria-hidden
        initial={reduce ? false : { width: '0em', opacity: 0 }}
        animate={{ width: `${piece.width}em`, opacity: 1 }}
        whileHover={reduce || piece.zoom ? undefined : { width: `${piece.width * 1.35}em`, rotate: 0, transition: { duration: 0.6, ease: EASE } }}
        transition={{ duration: 1.1, ease: EASE, delay }}
        className="relative mx-[0.04em] inline-block h-[0.8em] overflow-hidden rounded-full align-middle shadow-soft"
        style={{ rotate: piece.rotate, translate: '0 -0.06em' }}
      >
        <Image src={piece.img} alt="" fill priority sizes="360px" className="object-cover" />
      </motion.span>{' '}
    </>
  )
}

