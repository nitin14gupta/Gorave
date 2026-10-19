'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { GALLERY, TEAM, founderHref, type Founder } from '@/lib/founders'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Chapter } from '@/components/ui/atoms'

const EASE = [0.2, 0.8, 0.2, 1] as const

/**
 * One founder. A big polaroid that leans toward your cursor beside their
 * name and their own words; then their story, small true things about
 * them as hover rows, their links, and the other founder.
 */
export function FounderProfile({ f }: { f: Founder }) {
  const reduce = !!useReducedMotion()
  const other = TEAM.find(t => t.key !== f.key)!
  const [firstName, ...rest] = f.name.split(' ')
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Founders', href: '/founders' },
    { label: f.name, href: founderHref(f) },
  ]

  // Cursor tilt on the photo
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 160, damping: 18 })
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 160, damping: 18 })

  // The name drifts apart a touch as you scroll away from the hero
  const hero = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: hero, offset: ['start start', 'end start'] })
  const drift = useTransform(p, [0, 1], [0, reduce ? 0 : 80])
  const driftBack = useTransform(drift, v => -v)

  return (
    <main className="bg-cream">
      <section ref={hero} className="overflow-hidden px-6 pb-20 pt-28 md:px-12 lg:px-20">
        <div className="mx-auto max-w-[1180px]">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mt-10 grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
            <div style={{ perspective: 1100 }} className="order-2 mx-auto w-full max-w-[420px] lg:order-1">
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 40, rotate: f.side * 6 }}
                animate={{ opacity: 1, y: 0, rotate: f.side * 3 }}
                transition={{ duration: 1, ease: EASE }}
                onPointerMove={e => {
                  if (reduce || e.pointerType !== 'mouse') return
                  const r = e.currentTarget.getBoundingClientRect()
                  mx.set((e.clientX - r.left) / r.width - 0.5)
                  my.set((e.clientY - r.top) / r.height - 0.5)
                }}
                onPointerLeave={() => { mx.set(0); my.set(0) }}
                style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
                className="relative bg-white p-3 pb-20 shadow-pop"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-tile">
                  <Image src={f.photo} alt={`${f.name}, ${f.role} of Gorave`} fill priority sizes="420px" className="object-cover" style={{ objectPosition: f.pos }} />
                </div>
                <div className="absolute inset-x-4 bottom-5 font-serif text-[28px] italic leading-none">
                  {f.first} <span className="text-orange">{f.verb}</span>
                </div>
                <span aria-hidden className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 rotate-[-3deg] bg-gold/45" />
              </motion.div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">{f.role}</div>
              <h1 className="mt-4 font-display text-[clamp(64px,9vw,152px)] font-extrabold leading-[0.84] tracking-[-0.07em]">
                <motion.span style={{ x: driftBack }} className="block">{firstName}</motion.span>
                <motion.span style={{ x: drift }} className="block text-ink-3">{rest.join(' ')}</motion.span>
              </h1>
              <div className="mt-6 flex flex-wrap gap-2">
                {f.tags.map(t => <span key={t} className="rounded-full bg-white px-4 py-2 font-sans text-sm font-bold shadow-soft">{t}</span>)}
              </div>
              <blockquote className="mt-8 max-w-[520px] font-serif text-[clamp(26px,2.6vw,36px)] italic leading-snug text-ink">
                “{f.quote}”
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-paper px-6 py-24 md:px-12 md:py-28 lg:px-20">
        <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <Chapter n="01" title={`${f.first}’s story`} />
            <h2 className="mt-4 font-display text-[clamp(40px,5vw,76px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              In {f.first === 'Nitin' ? 'his' : 'her'}
              <span className="font-serif font-normal italic tracking-[-0.03em] text-orange"> own words.</span>
            </h2>
          </div>
          <div className="space-y-6">
            {f.story.map((para, i) => (
              <motion.p
                key={para.slice(0, 30)}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.7, ease: EASE, delay: i * 0.05 }}
                className={i === 0 ? 'font-display text-[clamp(22px,2.2vw,30px)] font-extrabold leading-snug tracking-[-0.03em]' : 'font-sans text-[18px] leading-[1.75] text-ink-2'}
              >
                {para}
              </motion.p>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-12 md:py-28 lg:px-20">
        <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <Chapter n="02" title="Small true things" />
            <h2 className="mt-4 font-display text-[clamp(40px,5vw,76px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              The
              <span className="font-serif font-normal italic tracking-[-0.03em] text-orange"> fine print.</span>
            </h2>
          </div>
          <ul className="border-t border-ink/12">
            {f.facts.map(x => (
              <li key={x.k} className="group grid gap-1 border-b border-ink/12 py-5 transition-colors duration-500 hover:bg-white sm:grid-cols-[180px_1fr] sm:gap-6 sm:px-4">
                <span className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">{x.k}</span>
                <span className="font-display text-[clamp(20px,2vw,26px)] font-extrabold leading-snug tracking-[-0.03em] transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5">{x.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper px-6 py-20 md:px-12 lg:px-20">
        <div className="mx-auto max-w-[1180px]">
          <Chapter n="03" title={`Find ${f.first}`} />
          <ul className="mt-8 flex flex-wrap gap-3">
            {f.links.map(l => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer me" className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-4 font-display text-[22px] font-extrabold tracking-[-0.035em] shadow-soft transition-[transform,background-color,color] duration-500 ease-out-expo hover:-translate-y-1 hover:bg-ink hover:text-cream">
                  {l.label}
                  <span aria-hidden className="text-lg transition-transform duration-500 group-hover:-rotate-45">→</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-14 flex gap-3 overflow-hidden">
            {GALLERY.slice(f.side === -1 ? 0 : 5, f.side === -1 ? 5 : 10).map((src, i) => (
              <div key={src} className="group relative h-[200px] w-[160px] shrink-0 overflow-hidden rounded-[20px] bg-tile md:h-[240px] md:w-[200px]" style={{ transform: `rotate(${i % 2 ? 2 : -2}deg)` }}>
                <Image src={src} alt="" fill sizes="200px" className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-110" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-12 md:py-28 lg:px-20">
        <div className="mx-auto grid max-w-[1180px] gap-3 md:grid-cols-[1.4fr_1fr]">
          <Link href={founderHref(other)} className="group relative flex min-h-[260px] items-end overflow-hidden rounded-[32px] bg-white p-8 shadow-soft transition-shadow duration-500 hover:shadow-pop">
            <div className="absolute inset-y-0 right-0 w-[45%] overflow-hidden">
              <Image src={other.photo} alt="" fill sizes="400px" className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-105" style={{ objectPosition: other.pos }} />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent" />
            </div>
            <div className="relative max-w-[55%]">
              <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">The other half</div>
              <div className="mt-3 font-display text-[clamp(32px,3.6vw,52px)] font-extrabold leading-[0.95] tracking-[-0.05em]">{other.name}</div>
              <div className="mt-2 font-serif text-xl italic text-orange">{other.first} {other.verb}</div>
              <div className="mt-6 font-sans text-sm font-bold">Meet {other.first} <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span></div>
            </div>
          </Link>
          <Link href="/founders" className="group flex min-h-[260px] flex-col justify-between rounded-[32px] bg-brand p-8 text-white transition-transform duration-500 ease-out-expo hover:-translate-y-1">
            <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-white/75">How it started</div>
            <div className="font-display text-[clamp(30px,3vw,42px)] font-extrabold leading-tight tracking-[-0.045em]">An empty apartment and a party where nobody talked.</div>
            <div className="font-sans text-sm font-bold">Read the story <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span></div>
          </Link>
        </div>
      </section>
    </main>
  )
}
