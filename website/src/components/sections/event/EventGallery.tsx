'use client'

import Image from 'next/image'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/cn'

/** Cover photos: one big frame that cross-fades, thumbnails underneath. */
export function EventGallery({ photos, title }: { photos: string[]; title: string }) {
  const [i, setI] = useState(0)
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-tile shadow-soft">
        <AnimatePresence initial={false}>
          <motion.div
            key={photos[i]}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Image src={photos[i]} alt={title} fill priority={i === 0} sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2.5">
          {photos.slice(0, 6).map((p, k) => (
            <button
              key={p}
              type="button"
              onClick={() => setI(k)}
              aria-label={`Photo ${k + 1}`}
              className={cn(
                'relative h-16 w-20 overflow-hidden rounded-xl transition-[opacity,transform] duration-300 hover:-translate-y-0.5',
                k === i ? 'ring-[3px] ring-ink ring-offset-2 ring-offset-cream' : 'opacity-60 hover:opacity-100',
              )}
            >
              <Image src={p} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
