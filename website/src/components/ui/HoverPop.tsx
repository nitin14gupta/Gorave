'use client'

import Image from 'next/image'
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { cn } from '@/lib/cn'

/**
 * HoverPop: hover anything wrapped in it (a word in a sentence, a list row,
 * a name) and a photo springs out at the cursor, tilting with the way you
 * move, and swaps smoothly as you slide from one item to the next.
 *
 *   <HoverPopGroup>
 *     I love <HoverPop image="/a.webp">rooftops</HoverPop> and
 *     <HoverPop image="/b.webp" caption="Game nights">game nights</HoverPop>.
 *   </HoverPopGroup>
 *
 * One floating card per group (so moving between items morphs instead of
 * flickering). Rendered in a portal, so no transformed ancestor can offset
 * it. Mouse only; touch just sees the content.
 */

type Pop = { id: string; image: string; caption?: ReactNode }
const Ctx = createContext<((p: Pop | null) => void) | null>(null)

export function HoverPopGroup({ children, size = 'md' }: { children: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const reduce = !!useReducedMotion()
  const [pop, setPop] = useState<Pop | null>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const vx = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 380, damping: 32 })
  const y = useSpring(my, { stiffness: 380, damping: 32 })
  // Tilt toward the direction of travel, settling back when still.
  const rotate = useSpring(useTransform(vx, [-40, 40], [-10, 10]), { stiffness: 200, damping: 18 })
  const last = useRef(0)
  const open = useRef(false)

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      vx.set(Math.max(-40, Math.min(40, e.clientX - last.current)))
      last.current = e.clientX
      mx.set(e.clientX)
      my.set(e.clientY)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [mx, my, vx])

  // Settle the tilt when the cursor stops.
  useEffect(() => {
    if (!pop) return
    const id = window.setInterval(() => vx.set(0), 120)
    return () => window.clearInterval(id)
  }, [pop, vx])

  const show = (p: Pop | null) => {
    if (p && !open.current) {
      x.jump(mx.get())
      y.jump(my.get())
    }
    open.current = !!p
    setPop(p)
  }

  const box = size === 'sm' ? 'w-[180px] h-[130px]' : size === 'lg' ? 'w-[320px] h-[230px]' : 'w-[240px] h-[170px]'

  return (
    <Ctx.Provider value={reduce ? null : show}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {pop && (
              <motion.div
                key="pop"
                aria-hidden
                style={{ x, y, rotate }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                className="pointer-events-none fixed left-0 top-0 z-[80] hidden md:block"
              >
                <div className={cn('relative -translate-x-1/2 -translate-y-[115%] overflow-hidden rounded-[22px] bg-tile shadow-pop ring-4 ring-white', box)}>
                  <AnimatePresence initial={false}>
                    <motion.div key={pop.id} initial={{ opacity: 0, scale: 1.15 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0">
                      <Image src={pop.image} alt="" fill sizes="320px" className="object-cover" />
                    </motion.div>
                  </AnimatePresence>
                  {pop.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3.5 pb-3 pt-8 font-sans text-[13px] font-bold text-white">{pop.caption}</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </Ctx.Provider>
  )
}

export function HoverPop({ image, caption, children, className, as = 'span' }: { image: string; caption?: ReactNode; children: ReactNode; className?: string; as?: 'span' | 'div' | 'li' }) {
  const show = useContext(Ctx)
  const id = useId()
  const Tag = as
  return (
    <Tag
      onMouseEnter={() => show?.({ id: id + image, image, caption })}
      onMouseLeave={() => show?.(null)}
      className={className}
    >
      {children}
    </Tag>
  )
}
