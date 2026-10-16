'use client'

import { Children, type ReactNode } from 'react'
import { motion } from 'motion/react'

/** Children rise in one after another as the group scrolls into view. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} transition={{ staggerChildren: 0.07 }}>
      {Children.map(children, child => (
        <motion.div
          variants={{ hidden: { opacity: 0, y: 40, rotate: 1.5 }, show: { opacity: 1, y: 0, rotate: 0 } }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
