'use client'

import Image from 'next/image'
import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/cn'

// Beside the big photo: how the other photos tile, by how many there are.
const SIDE_GRID: Record<number, string> = {
  1: 'grid-cols-1 grid-rows-1',
  2: 'grid-cols-2 lg:grid-cols-1 lg:grid-rows-2',
  3: 'grid-cols-3 lg:grid-cols-2 lg:grid-rows-2 [&>*:first-child]:lg:col-span-2',
  4: 'grid-cols-4 lg:grid-cols-2 lg:grid-rows-2',
}

/**
 * The host's photos as a bento, for anything from 1 to 5. The big photo is
 * always 4:5 and uncut; the tiles are previews, tap one and it becomes the
 * big one. With a single photo, `solo` takes the other half of the block.
 */
export function EventBento({ photos, title, solo }: { photos: string[]; title: string; solo?: ReactNode }) {
  const [big, setBig] = useState(0)
  const list = photos.slice(0, 5)
  const others = list.map((p, i) => ({ p, i })).filter(x => x.i !== big)

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-tile">
        <AnimatePresence initial={false}>
          <motion.div
            key={list[big]}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Image src={list[big]} alt={title} fill priority sizes="(max-width: 1024px) 100vw, 440px" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      </div>

      {others.length === 0 ? solo : (
        <div className={cn('grid h-24 min-h-0 gap-3 sm:h-32 lg:h-auto', SIDE_GRID[others.length])}>
          {others.map(({ p, i }) => (
            <button
              key={p}
              type="button"
              onClick={() => setBig(i)}
              aria-label={`Show photo ${i + 1}`}
              className="group relative min-h-0 overflow-hidden rounded-[20px] bg-tile"
            >
              <Image src={p} alt="" fill sizes="(max-width: 1024px) 40vw, 440px" className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
