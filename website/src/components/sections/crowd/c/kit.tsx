'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { cn } from '@/lib/cn'

// Shared bits for variant C ("Cinematic").

export const EASE = [0.2, 0.8, 0.2, 1] as const
export const EASE_CSS = 'cubic-bezier(.2,.8,.2,1)'

/** Round for SSR'd inline styles so server and client strings match. */
export const r2 = (n: number) => Math.round(n * 100) / 100

/** Which rule the crowd runs on, for crowd-specific UI. */
export type CrowdKind = 'women' | 'balanced' | 'age'
export function crowdKind(slug: string): CrowdKind {
  if (slug === 'women-only') return 'women'
  if (slug === 'balanced-crowd') return 'balanced'
  return 'age'
}

/** Fades and lifts children in once they scroll into view. */
export function Rise({ children, className, delay = 0, y = 40 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Magnetic hover: the child drifts toward the cursor while it is near, and
 * springs back on leave. Mouse only; touch gets a plain button.
 */
export function Magnetic({ children, strength = 0.35, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 180, damping: 14, mass: 0.6 })
  const y = useSpring(my, { stiffness: 180, damping: 14, mass: 0.6 })

  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== 'mouse') return
    const b = ref.current?.getBoundingClientRect()
    if (!b) return
    mx.set((e.clientX - (b.left + b.width / 2)) * strength)
    my.set((e.clientY - (b.top + b.height / 2)) * strength)
  }
  function onLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={cn('-m-5 inline-block p-5', className)}>
      <motion.div style={{ x, y }}>{children}</motion.div>
    </div>
  )
}
