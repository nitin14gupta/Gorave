'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { AREA_SCENES, cityStreet, type Area } from '@/lib/area'
import { cn } from '@/lib/cn'
import { CARD_SHADOW, Deckle, Grain, Postmark, SectionHead, Stamp } from './kit'

/**
 * Chapter 08, send a postcard. Write a friend's name, pick a picture and a
 * note; the card updates live (the picture flips when it changes) and tilts
 * with the cursor. "Send" uses the share sheet, or copies the link.
 */
export function SendPostcard({ area }: { area: Area }) {
  const { city } = area
  const reduce = useReducedMotion()
  const scenes = [
    { key: 'street', label: 'The street', src: cityStreet(city.slug) },
    { key: 'rooftop', label: 'Rooftop', src: AREA_SCENES.rooftop },
    { key: 'chai', label: 'Chai stop', src: AREA_SCENES.chai },
    { key: 'living', label: 'Living room', src: AREA_SCENES.livingroom },
  ]
  const notes = [
    `Saturday? There's a rooftop thing in ${area.name}.`,
    `Found a dinner party in ${area.name}. Save me a seat?`,
    `Game night in ${area.name} this week. You in?`,
  ]
  const [name, setName] = useState('')
  const [scene, setScene] = useState(0)
  const [note, setNote] = useState(0)
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const to = name.trim() || 'a friend'

  // cursor tilt
  const ref = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 60, damping: 16 })
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 60, damping: 16 })
  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== 'mouse') return
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  async function send() {
    const url = `${window.location.origin}/${city.slug}/${area.slug}`
    const text = `${name.trim() ? `${name.trim()}` : ''}${notes[note]}`
    const data = { title: `Postcards from ${area.name}`, text, url }
    try {
      if (typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data))) {
        await navigator.share(data)
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2400)
    } catch {
      // share sheet dismissed, or clipboard blocked, nothing to do
    }
  }

  return (
    <section className="relative overflow-hidden bg-paper px-6 py-28 md:px-20 md:py-32">
      <Deckle from="cream" seed={4} />
      <Grain />
      <div className="relative mx-auto max-w-[1240px]">
        <SectionHead n="08" label="Send a postcard" title="Know someone who'd" serif="love it here?" aside={`Write one from ${area.name} and send it on.`} />

        <div className="mt-14 grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          {/* controls */}
          <div className="space-y-9">
            <label className="block">
              <span className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">To</span>
              <input
                value={name}
                onChange={e => setName(e.target.value.slice(0, 24))}
                placeholder="your friend's name"
                className="mt-2 block w-full border-b-[1.5px] border-ink/20 bg-transparent pb-2 font-serif text-3xl italic text-ink outline-none transition-colors placeholder:text-ink-3/60 focus:border-orange"
              />
            </label>

            <fieldset>
              <legend className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">Picture</legend>
              <div className="mt-3 grid grid-cols-4 gap-3">
                {scenes.map((s, i) => (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={scene === i}
                    onClick={() => setScene(i)}
                    className={cn(
                      'group bg-white p-1.5 pb-2 text-left transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1',
                      scene === i ? 'shadow-[0_0_0_2px_var(--color-orange),0_14px_24px_-14px_rgb(23_19_16/0.5)]' : 'shadow-[0_10px_20px_-14px_rgb(23_19_16/0.45)]',
                    )}
                  >
                    <span className="relative block aspect-square overflow-hidden">
                      <Image src={s.src} alt="" fill sizes="120px" className="object-cover" />
                    </span>
                    <span className="mt-1.5 block truncate font-serif text-[13px] italic text-ink-2 sm:text-sm">{s.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">Note</legend>
              <div className="mt-3 space-y-2">
                {notes.map((n, i) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={note === i}
                    onClick={() => setNote(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-serif text-lg italic transition-colors duration-300',
                      note === i ? 'bg-white text-ink shadow-[0_10px_24px_-16px_rgb(23_19_16/0.5)]' : 'text-ink-2 hover:bg-white/60',
                    )}
                  >
                    <span className={cn('size-2.5 shrink-0 rounded-full transition-colors', note === i ? 'bg-orange' : 'bg-ink/15')} />
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={send}
                className="btn-shine inline-flex items-center gap-2 rounded-full px-7.5 py-4.5 font-sans text-[17px] font-bold text-white shadow-[0_14px_30px_-12px_rgb(255_56_100/0.6)] transition-transform duration-300 ease-out-expo hover:-translate-y-px"
              >
                Send to {to} →
              </button>
              <AnimatePresence>
                {copied && (
                  <motion.span
                    role="status"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                    className="font-serif text-xl italic text-ink-2"
                  >
                    Link copied ✓
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* the live postcard */}
          <div ref={ref} onPointerMove={onMove} onPointerLeave={() => { mx.set(0); my.set(0) }} className="[perspective:1400px]">
            <motion.div
              style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d' }}
              className={cn('relative mx-auto grid max-w-[680px] gap-4 bg-white p-3 sm:aspect-[3/2] sm:grid-cols-[1fr_1fr] sm:gap-6 sm:p-4', CARD_SHADOW)}
            >
              <div className="relative aspect-[4/3] [perspective:900px] sm:aspect-auto">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    key={scene}
                    initial={reduce ? { opacity: 0 } : { rotateY: -90, opacity: 0.3 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { rotateY: 90, opacity: 0 }}
                    transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
                    className="absolute inset-0 overflow-hidden bg-tile"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <Image src={scenes[scene].src} alt={scenes[scene].label} fill sizes="(max-width: 640px) 90vw, 340px" className="object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 pt-14 font-serif text-2xl italic text-white">Greetings from {area.name}</div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="relative flex min-w-0 flex-col px-1 pb-2 sm:border-l sm:border-dashed sm:border-ink/15 sm:pl-6">
                <div className="flex items-start justify-between">
                  <Postmark top={`${area.name} · ${city.name}`} bottom="by hand" center="hi!" className="w-[70px] -rotate-12 text-ink/45 sm:w-[84px]" />
                  <Stamp className="w-[52px] rotate-3 sm:w-[60px]">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Image src={scenes[scene].src} alt="" fill sizes="60px" className="object-cover" />
                    </div>
                  </Stamp>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={note}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                    className="mt-5 font-serif text-[clamp(22px,2.3vw,30px)] italic leading-[1.15] text-ink"
                  >
                    {notes[note]}
                  </motion.p>
                </AnimatePresence>
                <div className="mt-auto space-y-2.5 pt-6">
                  <div className="truncate border-b border-ink/15 pb-1 font-serif text-xl italic text-ink">To: {to}</div>
                  <div className="border-b border-ink/15 pb-1 font-serif text-base italic text-ink-3">via Gorave · {city.name}</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
