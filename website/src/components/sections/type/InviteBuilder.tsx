'use client'

import Image from 'next/image'
import { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { templateImage, type City } from '@/constants'
import type { TypeContent } from '@/lib/eventType'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const TEMPLATES = ['houseparty', 'retro', 'nightout', 'beack', 'halloween', 'christmas']
const DAYS = ['Fri 9 PM', 'Sat 9 PM', 'Sun 7 PM']

/**
 * Chapter 07 — make one. A tiny version of the app's invite maker: pick a
 * template, type a name, and the invite tilts in your hand as the cursor moves.
 */
export function InviteBuilder({ city, story }: { city: City; story: TypeContent }) {
  const [tpl, setTpl] = useState(TEMPLATES[0])
  const [title, setTitle] = useState('')
  const [day, setDay] = useState(DAYS[1])
  const placeholder = `${story.plural.replace(/s( &.*)?$/, '')} at mine`

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), { stiffness: 160, damping: 18 })
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 160, damping: 18 })
  const glare = useTransform(mx, [-0.5, 0.5], ['0%', '100%'])

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  return (
    <section className="overflow-hidden bg-cream px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-[1fr_1fr]">
        <div>
          <Chapter n="07" title="Your turn" />
          <h2 className="mt-4 font-display text-[clamp(44px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Throw one<br />this weekend.
          </h2>
          <p className="mt-4 max-w-[440px] font-sans text-lg text-ink-2">
            Try it here, then do it for real in the app. Hosting {story.plural.toLowerCase()} in {city.name} costs nothing — run up to two free-entry events a month, or charge from ₹99 and keep 90%.
          </p>

          <label className="mt-9 block font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3" htmlFor="invite-title">Name it</label>
          <input
            id="invite-title"
            value={title}
            maxLength={36}
            onChange={e => setTitle(e.target.value)}
            placeholder={placeholder}
            className="mt-2 w-full max-w-[440px] rounded-2xl bg-white px-5 py-4 font-display text-2xl font-extrabold tracking-[-0.03em] text-ink shadow-soft outline-none placeholder:text-ink-3/60 focus:ring-2 focus:ring-orange"
          />

          <div className="mt-6 font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">Pick a look</div>
          <div className="mt-2 flex flex-wrap gap-2.5">
            {TEMPLATES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTpl(t)}
                aria-label={`${t} template`}
                aria-pressed={tpl === t}
                className={cn(
                  'relative h-[72px] w-[54px] overflow-hidden rounded-xl transition-transform duration-300 ease-out-expo hover:-translate-y-1',
                  tpl === t ? 'ring-[3px] ring-ink ring-offset-2 ring-offset-cream' : 'opacity-70',
                )}
              >
                <Image src={templateImage(t)} alt="" fill sizes="108px" className="object-cover" />
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {DAYS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                className={cn('rounded-full px-4 py-2 font-sans text-sm font-bold transition-colors', day === d ? 'bg-ink text-cream' : 'bg-white text-ink-2 hover:text-ink')}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button href="/host" size="lg">Host in {city.name}</Button>
            <StoreBadges height={44} />
          </div>
        </div>

        <div
          onPointerMove={onMove}
          onPointerLeave={() => { mx.set(0); my.set(0) }}
          className="flex justify-center py-6"
          style={{ perspective: 1100 }}
        >
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="relative aspect-[3/4] w-full max-w-[400px] overflow-hidden rounded-[30px] shadow-pop"
          >
            <motion.div key={tpl} initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="absolute inset-0">
              <Image src={templateImage(tpl)} alt="Invite template" fill sizes="400px" className="object-cover" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 mix-blend-overlay"
              style={{ background: useTransform(glare, g => `linear-gradient(115deg, transparent 20%, rgb(255 255 255 / .55) ${g}, transparent 80%)`) }}
            />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white" style={{ transform: 'translateZ(40px)' }}>
              <div className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-white/70">You&apos;re invited</div>
              <div className="mt-2 break-words font-display text-[38px] font-extrabold leading-[0.95] tracking-[-0.045em]">{title || placeholder}</div>
              <div className="mt-3 flex items-center gap-2 font-sans text-sm font-bold">
                <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">{day}</span>
                <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">{city.areas[0]}, {city.name}</span>
              </div>
              <div className="mt-5 rounded-full bg-white py-3 text-center font-sans text-sm font-bold text-ink">Request to join</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
