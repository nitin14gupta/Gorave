'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { ReactLenis, useLenis } from 'lenis/react'
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
        <ScrollToTopOnNavigate />
        {children}
      </ReactLenis>
    </MotionConfig>
  )
}

/**
 * Lenis keeps its own scroll position, so Next's "scroll to top on navigation"
 * gets overridden and a new page opens wherever the last one was scrolled to.
 * Reset to the top whenever the path changes, except on browser back/forward,
 * where keeping the previous position is what people expect. Query-only
 * changes (lab switchers) and #anchors don't change the path, so they're untouched.
 */
function ScrollToTopOnNavigate() {
  const pathname = usePathname()
  const lenis = useLenis()
  const fromHistory = useRef(false)
  const last = useRef(pathname)

  useEffect(() => {
    const onPop = () => { fromHistory.current = true }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (last.current === pathname) return // first load, or Lenis just initialised
    last.current = pathname
    if (fromHistory.current) { fromHistory.current = false; return }
    lenis?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
  }, [pathname, lenis])

  return null
}
