'use client'

import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

/** Their photos, square like in the app: one big, the rest as thumbnails to switch to. */
export function MemberPhotos({ photos, name }: { photos: string[]; name: string }) {
  const [active, setActive] = useState(0)
  const [broken, setBroken] = useState<Set<string>>(new Set())
  const shown = photos.filter(p => !broken.has(p))
  const current = shown[Math.min(active, shown.length - 1)]
  const drop = (url: string) => setBroken(prev => new Set(prev).add(url))

  return (
    <div className="w-full max-w-[460px]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative aspect-square overflow-hidden rounded-[32px] bg-tile shadow-pop"
      >
        {current ? (
          <Image key={current} src={current} alt={name} fill priority sizes="(min-width: 768px) 460px, 100vw" className="object-cover" onError={() => drop(current)} />
        ) : (
          <div className="grid size-full place-items-center bg-brand font-display text-[140px] font-extrabold text-white">{name[0]}</div>
        )}
      </motion.div>

      {shown.length > 1 ? (
        <div className="mt-3 grid grid-cols-6 gap-2">
          {shown.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1} of ${shown.length}`}
              aria-pressed={i === active}
              className={cn(
                'relative aspect-square overflow-hidden rounded-2xl bg-tile transition-opacity',
                i === active ? 'ring-2 ring-ink ring-offset-2 ring-offset-cream' : 'opacity-70 hover:opacity-100',
              )}
            >
              <Image src={url} alt="" fill sizes="72px" className="object-cover" onError={() => drop(url)} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
