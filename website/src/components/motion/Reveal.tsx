'use client'

import type { ReactNode } from 'react'
import { motion, type Variants } from 'motion/react'

const EASE = [0.2, 0.8, 0.2, 1] as const

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  /** Distance travelled upward while fading in */
  y?: number
  as?: 'div' | 'section' | 'li' | 'span'
}

/** Fades + rises into place the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0, y = 32, as = 'div' }: RevealProps) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </Tag>
  )
}

const group: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } }
const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
}

/** Staggers its direct `StaggerItem` children in on view. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={group} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-10% 0px' }}>
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} variants={item}>{children}</motion.div>
}

/** Splits a line into words that rise through a mask one after another. */
export function SplitWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: delay + i * 0.07 }}
          >
            {word}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  )
}
