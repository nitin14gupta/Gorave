'use client'

import type { ReactNode } from 'react'
import { ReactLenis } from 'lenis/react'
import { MotionConfig, useReducedMotion } from 'motion/react'

// Lenis gives the whole site inertial scrolling; Motion's scroll hooks read
// the same native scroll position, so pinned/parallax sections stay in sync.
// The tree is identical on server and client (no hydration mismatch); people
// who ask the OS for reduced motion just get native wheel scrolling.
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <MotionConfig reducedMotion="user">
      <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: !reduce }}>
        {children}
      </ReactLenis>
    </MotionConfig>
  )
}
