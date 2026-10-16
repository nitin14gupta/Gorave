'use client'

import { useEffect, useState } from 'react'

const fmt = () => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })

/** Current time in India, refreshed every 15s. Empty on the server (no hydration mismatch). */
export function useIstClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => setTime(fmt())
    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])
  return time
}
