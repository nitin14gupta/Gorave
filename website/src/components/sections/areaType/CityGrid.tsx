'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { EVENT_TYPES } from '@/constants'
import type { AreaTypeProps } from '@/lib/areaType'
import { cn } from '@/lib/cn'
import { Head, countLabel } from './kit'

const SHORT: Record<string, string> = {
  'house-parties': 'House',
  'rooftop-parties': 'Rooftop',
  'game-nights': 'Games',
  'dinner-parties': 'Dinner',
  'music-nights': 'Music',
  events: 'Other',
}

/**
 * Chapter 02, every night in the city. The whole city as one grid:
 * neighbourhoods down, kinds of night across, live counts in every cell and
 * this page lit up. Hover a cell and its row and column light up like a
 * crosshair while a preview follows the cursor. Every cell is a page.
 */
export function CityGrid({ area, type, grid }: AreaTypeProps) {
  const box = useRef<HTMLDivElement>(null)
  const [hot, setHot] = useState<{ r: number; c: number } | null>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 300, damping: 28 })
  const y = useSpring(my, { stiffness: 300, damping: 28 })
  const cell = hot ? grid[hot.r].cells[hot.c] : null
  const row = hot ? grid[hot.r] : null
  const max = Math.max(1, ...grid.flatMap(g => g.cells.map(c => c.count)))

  function onMove(e: React.PointerEvent) {
    const r = box.current?.getBoundingClientRect()
    if (!r || e.pointerType !== 'mouse') return
    mx.set(e.clientX - r.left)
    my.set(e.clientY - r.top)
  }

  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1180px]">
        <Head
          n="02"
          label={`Every night in ${area.city.name}`}
          title={`All of ${area.city.name},`}
          serif="one grid."
          aside="Every neighbourhood, every kind of night, what’s on in each right now. Hover to look, tap to go."
        />

        <div ref={box} onPointerMove={onMove} onMouseLeave={() => setHot(null)} className="relative mt-12 -mx-6 overflow-x-auto px-6 md:mx-0 md:overflow-visible md:px-0">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-[26%]" />
                {EVENT_TYPES.map((t, c) => (
                  <th
                    key={t.slug}
                    scope="col"
                    className={cn(
                      'pb-4 text-center font-sans text-xs font-bold uppercase tracking-[0.14em] transition-colors duration-300',
                      hot?.c === c || t.slug === type.slug ? 'text-ink' : 'text-ink-3',
                    )}
                  >
                    {SHORT[t.slug] ?? t.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((g, r) => (
                <tr key={g.slug}>
                  <th
                    scope="row"
                    className={cn(
                      'sticky left-0 z-[1] border-t border-ink/10 bg-paper py-1 pr-4 text-left font-display text-[18px] font-extrabold tracking-[-0.03em] transition-colors duration-300 md:text-[22px]',
                      hot?.r === r || g.slug === area.slug ? 'text-ink' : 'text-ink-2',
                    )}
                  >
                    {g.name}
                  </th>
                  {g.cells.map((c, ci) => {
                    const here = g.slug === area.slug && c.type === type.slug
                    const lit = hot && (hot.r === r || hot.c === ci)
                    const fill = c.count / max
                    return (
                      <td key={c.type} className={cn('border-t border-ink/10 p-1 transition-colors duration-300', lit && 'bg-orange/[0.06]')}>
                        <Link
                          href={c.href}
                          onMouseEnter={() => setHot({ r, c: ci })}
                          onFocus={() => setHot({ r, c: ci })}
                          aria-label={`${c.label} in ${g.name}: ${countLabel(c.count)}`}
                          aria-current={here ? 'page' : undefined}
                          className={cn(
                            'relative grid h-12 place-items-center rounded-xl font-sans text-[15px] font-bold transition-[transform,background-color,color] duration-300 ease-out-expo hover:scale-110 md:h-14',
                            here ? 'bg-orange text-white shadow-soft' : c.count ? 'text-ink' : 'text-ink-3/50',
                            hot?.r === r && hot.c === ci && !here && 'bg-ink text-cream',
                          )}
                        >
                          {!here && c.count > 0 && !(hot?.r === r && hot.c === ci) && (
                            <span aria-hidden className="absolute inset-1.5 rounded-lg bg-orange" style={{ opacity: Math.round((0.08 + fill * 0.22) * 100) / 100 }} />
                          )}
                          <span className="relative">{c.count || '·'}</span>
                        </Link>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* The preview that follows the cursor */}
          <AnimatePresence>
            {cell && row && (
              <motion.div
                key="preview"
                aria-hidden
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.25 }}
                style={{ x, y }}
                className="pointer-events-none absolute left-0 top-0 z-20 hidden md:block"
              >
                <div className="ml-6 mt-6 w-[230px] overflow-hidden rounded-[22px] bg-white shadow-pop">
                  <div className="relative h-[140px]">
                    <AnimatePresence initial={false}>
                      <motion.div key={cell.image} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                        <Image src={cell.image} alt="" fill sizes="230px" className="object-cover" />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="p-3.5">
                    <div className="font-display text-lg font-extrabold leading-tight tracking-[-0.03em]">{cell.label} in {row.name}</div>
                    <div className="mt-0.5 font-sans text-xs font-bold text-ink-3">{countLabel(cell.count)}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center gap-3 font-sans text-xs font-bold text-ink-3">
          <span className="inline-block size-3 rounded-[4px] bg-orange" /> You are here
          <span className="ml-4 inline-block size-3 rounded-[4px] bg-orange/25" /> Something on
          <span className="ml-4">· Nothing yet</span>
        </div>
      </div>
    </section>
  )
}
