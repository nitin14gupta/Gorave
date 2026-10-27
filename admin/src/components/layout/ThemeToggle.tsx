'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'

/** Sun / moon switch between the dark (Noir) and light (cream) themes. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme)
  const toggle = useThemeStore((s) => s.toggle)
  // The server can't know the saved theme, so render the icon after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const light = mounted && theme === 'light'

  return (
    <button
      onClick={toggle}
      aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
      title={light ? 'Dark mode' : 'Light mode'}
      className={cn('flex h-9 w-9 items-center justify-center rounded-full border border-divider text-ink-secondary transition-colors hover:bg-surface hover:text-ink-primary', className)}
    >
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  )
}
