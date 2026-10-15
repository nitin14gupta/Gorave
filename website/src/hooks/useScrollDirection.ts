'use client'

import { useEffect, useState } from 'react'

/**
 * Whether the floating nav should be visible: shown near the top of the page,
 * hidden while scrolling down, shown again on any upward scroll or when the
 * cursor comes within `revealZone` px of the top edge.
 */
export function useNavVisibility({ threshold = 120, revealZone = 90 } = {}) {
  const [visible, setVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const delta = y - lastY
        setScrolled(y > 24)
        if (y < threshold) setVisible(true)
        else if (delta > 6) setVisible(false)
        else if (delta < -6) setVisible(true)
        lastY = y
        ticking = false
      })
    }
    const onMove = (e: MouseEvent) => {
      if (e.clientY <= revealZone) setVisible(true)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMove)
    }
  }, [threshold, revealZone])

  return { visible, scrolled, show: () => setVisible(true) }
}
