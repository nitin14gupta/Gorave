'use client'

import { useEffect, useRef } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react'
import { PHOTOS, type City } from '@/constants'
import type { TypeContent } from '@/lib/eventType'
import type { Crumb } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'

/**
 * The lights are off. Move the cursor and a torch finds the party, the photo
 * is only lit inside a soft spotlight. On touch screens the light wanders by itself.
 */
export function TypeHero({ city, story, crumbs }: { city: City; story: TypeContent; crumbs: Crumb[] }) {
  const ref = useRef<HTMLElement>(null)
  const mx = useMotionValue(62)
  const my = useMotionValue(42)
  const x = useSpring(mx, { stiffness: 120, damping: 22 })
  const y = useSpring(my, { stiffness: 120, damping: 22 })
  const mask = useMotionTemplate`radial-gradient(circle 280px at ${x}% ${y}%, #000 0%, #000 35%, transparent 100%)`
  const src = `${PHOTOS[story.heroPhoto]}?w=2000&q=70&auto=format`

  // No hover (touch, or the cursor hasn't arrived yet): drift the light around the photo.
  useEffect(() => {
    if (window.matchMedia('(hover: hover)').matches) return
    const a = animate(mx, [62, 30, 48, 72, 62], { duration: 12, repeat: Infinity, ease: 'easeInOut' })
    const b = animate(my, [42, 58, 30, 62, 42], { duration: 12, repeat: Infinity, ease: 'easeInOut' })
    return () => { a.stop(); b.stop() }
  }, [mx, my])

  function onMove(e: React.PointerEvent) {
    const r = ref.current?.getBoundingClientRect()
    if (!r || e.pointerType !== 'mouse') return
    mx.set(((e.clientX - r.left) / r.width) * 100)
    my.set(((e.clientY - r.top) / r.height) * 100)
  }

  return (
    <section ref={ref} onPointerMove={onMove} className="relative min-h-[100svh] overflow-hidden bg-noir text-noir-ink">
      <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-[0.13] grayscale" style={{ backgroundImage: `url(${src})` }} />
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${src})`, maskImage: mask, WebkitMaskImage: mask }}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-noir via-noir/30 to-noir/60" />

      <div className="relative z-10 flex min-h-[100svh] flex-col px-6 pb-14 pt-28 md:px-20">
        <Breadcrumbs crumbs={crumbs} className="text-noir-ink-2 [&_[aria-current]]:text-noir-ink [&_a:hover]:text-noir-ink" />

        <div className="mt-auto">
          <h1 className="font-display text-[clamp(64px,11vw,184px)] font-extrabold leading-[0.84] tracking-[-0.065em]">
            {story.plural}
            <br />
            <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">in {city.name}.</span>
          </h1>
          <div className="mt-9 flex flex-wrap items-end justify-between gap-8">
            <p className="max-w-[460px] font-sans text-xl leading-relaxed text-noir-ink-2">{story.heroLine}</p>
            <div className="flex flex-wrap gap-2.5">
              <Button href="#events" size="lg">See what&apos;s on</Button>
              <Button href="/host" kind="ghost" dark size="lg">Host one</Button>
            </div>
          </div>
          <div className="mt-10 hidden font-sans text-xs font-bold uppercase tracking-[0.18em] text-noir-ink-2/70 md:block">Move your cursor to find the party</div>
        </div>
      </div>
    </section>
  )
}
