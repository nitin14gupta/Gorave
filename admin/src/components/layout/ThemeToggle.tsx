'use client'

import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'

/**
 * Sun / moon switch between the dark (Noir) and light (cream) themes. Both
 * icons render; CSS shows the right one from <html data-theme>, so the server
 * render already matches and nothing flashes.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const toggle = useThemeStore((s) => s.toggle)
  return (
    <button
      onClick={toggle}
      aria-label="Switch light or dark mode"
      title="Light or dark mode"
      className={cn('flex h-9 w-9 items-center justify-center rounded-full border border-divider text-ink-secondary transition-colors hover:bg-surface hover:text-ink-primary', className)}
    >
      <Sun className="h-4 w-4 light:hidden" />
      <Moon className="hidden h-4 w-4 light:block" />
    </button>
  )
}
