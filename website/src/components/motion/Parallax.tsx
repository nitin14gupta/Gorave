'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'motion/react'

interface Props {
  children: ReactNode
  className?: string
  /** px moved across the element's pass through the viewport; negative = up */
  offset?: number
  rotate?: number
}

/** Drifts its content vertically as the element scrolls past. */
export function Parallax({ children, className, offset = -80, rotate = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [-offset / 2, offset / 2]), { stiffness: 120, damping: 30 })
  const r = useTransform(scrollYProgress, [0, 1], [-rotate, rotate])
  return (
    <motion.div ref={ref} className={className} style={{ y, rotate: r }}>
      {children}
    </motion.div>
  )
}

/** Gentle idle bob — for polaroids and floating cards. */
export function Float({ children, className, delay = 0, rotate = 0 }: { children: ReactNode; className?: string; delay?: number; rotate?: number }) {
  return (
    <motion.div
      className={className}
      style={{ rotate }}
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  )
}
