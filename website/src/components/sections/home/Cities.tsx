'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { CITIES, PHOTOS } from '@/constants'
import { cn } from '@/lib/cn'
import { Eyebrow, H2, Lede } from '@/components/ui/atoms'
import { Reveal } from '@/components/motion/Reveal'

/** City list with a photo that follows the cursor and swaps per row. */
export function Cities() {
  const listRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 260, damping: 26 })
  const y = useSpring(my, { stiffness: 260, damping: 26 })

  const onMove = (e: React.MouseEvent) => {
    const r = listRef.current?.getBoundingClientRect()
    if (!r) return
    mx.set(e.clientX - r.left - 115)
    my.set(e.clientY - r.top - 145)
  }

  const rows = CITIES.slice(0, 6)

  return (
    <section className="bg-paper px-6 py-28 md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <Eyebrow>Cities</Eyebrow>
          <H2 className="mb-5 mt-3.5 !text-[clamp(40px,5vw,72px)]">Where&apos;s the party tonight?</H2>
          <Lede>Pick your city to see what&apos;s on near you.</Lede>
        </Reveal>

        <div ref={listRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setHovered(null)}>
          {rows.map((c, i) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              onMouseEnter={() => setHovered(i)}
              className={cn(
                'relative z-10 flex items-center justify-between border-t-[1.5px] border-ink py-5 transition-colors duration-300',
                hovered === i ? 'text-orange' : 'text-ink',
              )}
            >
              <span className="font-display text-[clamp(36px,4.4vw,52px)] font-extrabold tracking-[-0.04em] transition-transform duration-500 ease-out-expo" style={{ transform: hovered === i ? 'translateX(12px)' : undefined }}>
                {c.name}
              </span>
              <span className="hidden font-sans text-[15px] font-bold opacity-70 sm:block">{c.areas.slice(0, 3).join(' · ')} →</span>
            </Link>
          ))}

          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-20 hidden h-[290px] w-[230px] overflow-hidden rounded-[22px] shadow-pop md:block"
            style={{ x, y, rotate: 5 }}
            animate={{ opacity: hovered === null ? 0 : 1, scale: hovered === null ? 0.85 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence initial={false}>
              {hovered !== null && (
                <motion.div key={hovered} className="absolute inset-0" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                  <Image src={PHOTOS[rows[hovered].photo]} alt="" fill sizes="460px" className="object-cover" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
