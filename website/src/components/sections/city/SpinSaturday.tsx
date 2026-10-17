'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { EVENT_TYPES, type City } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { Poster } from '@/components/ui/Poster'
import { useCityKit } from './CityKit'

const ITEM_H = 96
const LOOPS = 40
const TIMES = ['7 PM', '8 PM', '9 PM', '10 PM', '11 PM', 'Late']

function Reel({ items, index, duration }: { items: string[]; index: number; duration: number }) {
  const long = Array.from({ length: LOOPS }, () => items).flat()
  return (
    <div className="relative h-[96px] flex-1 overflow-hidden rounded-[22px] bg-white shadow-[inset_0_0_0_1.5px_var(--color-line)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-white to-transparent" />
      <motion.div animate={{ y: -index * ITEM_H }} transition={{ duration, ease: [0.15, 0.85, 0.25, 1] }}>
        {long.map((t, i) => (
          <div key={i} className="flex h-[96px] items-center justify-center px-3 text-center font-display text-[clamp(20px,2.4vw,32px)] font-extrabold tracking-[-0.03em]">{t}</div>
        ))}
      </motion.div>
    </div>
  )
}

/**
 * Chapter 04 — the dare. A slot machine for your Saturday: vibe × area ×
 * time. Spin, reels land one after another, a matching flyer drops in.
 */
export function SpinSaturday({ city }: { city: City }) {
  const { posters } = useCityKit()
  const vibes = EVENT_TYPES.filter(t => t.key !== 'other').map(t => t.label)
  const reels = [vibes, city.areas, TIMES]
  const [idx, setIdx] = useState([0, 0, 0])
  const [spins, setSpins] = useState(0)

  const spin = () => {
    // Always move forward from the current position so the reel keeps rolling.
    setIdx(cur => cur.map((v, r) => {
      const n = reels[r].length
      const base = Math.ceil((v + 1) / n) * n
      return Math.min(base + n * (3 + r) + Math.floor(Math.random() * n), n * LOOPS - 1)
    }))
    setSpins(s => s + 1)
  }

  const landed = idx.map((v, r) => reels[r][v % reels[r].length])

  return (
    <section className="bg-sage px-6 py-28 md:px-20">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Chapter n="04" title="The dare" className="!text-sage-ink/70" />
          <h2 className="mt-4 font-display text-[clamp(48px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em] text-sage-ink">
            Can&apos;t decide?<br />Spin your Saturday.
          </h2>
          <div className="mt-10 flex gap-3">
            {reels.map((items, r) => <Reel key={r} items={items} index={idx[r]} duration={1.2 + r * 0.45} />)}
          </div>
          <button
            type="button"
            onClick={spin}
            className="btn-shine mt-6 rounded-full px-9 py-4.5 font-sans text-lg font-bold text-white shadow-[0_14px_30px_-12px_rgb(255_56_100/0.6)] transition-transform hover:-translate-y-0.5 active:scale-95"
          >
            {spins ? 'Spin again' : 'Spin'}
          </button>
        </div>

        <div className="relative flex h-[440px] items-center justify-center">
          <AnimatePresence mode="popLayout">
            {spins > 0 ? (
              <motion.div
                key={spins}
                initial={{ opacity: 0, y: -120, rotate: -16 }}
                animate={{ opacity: 1, y: 0, rotate: 4, transition: { delay: 2.1, type: 'spring', stiffness: 200, damping: 16 } }}
                exit={{ opacity: 0, x: 120, rotate: 20, transition: { duration: 0.35 } }}
                className="text-center"
              >
                <Poster poster={posters[(spins * 5) % posters.length]} area={landed[1]} width={270} height={350} radius={22} className="shadow-pop" />
                <div className="mt-5 font-display text-2xl font-extrabold text-sage-ink">{landed[0]} · {landed[1]} · {landed[2]}</div>
              </motion.div>
            ) : (
              <motion.div key="empty" exit={{ opacity: 0 }} className="flex h-[350px] w-[270px] rotate-3 items-center justify-center rounded-[22px] border-2 border-dashed border-sage-ink/30 p-8 text-center font-display text-2xl font-extrabold text-sage-ink/50">
                Your night lands here
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
