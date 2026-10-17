'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MEGA_MENUS, NAV_LINKS, type MegaMenuDef } from '@/constants'
import { useNavVisibility } from '@/hooks/useScrollDirection'
import { cn } from '@/lib/cn'
import { Logo } from '@/components/ui/Logo'
import { Button } from '@/components/ui/Button'
import { MegaMenu } from './MegaMenu'

const EASE = [0.2, 0.8, 0.2, 1] as const
const CLOSE_DELAY_MS = 140

export function SmartNavbar() {
  const { visible, scrolled } = useNavVisibility()
  const [openKey, setOpen] = useState<MegaMenuDef['key'] | null>(null)
  // The nav hiding mid-hover would strand the panel, it closes with the nav.
  const open = visible ? openKey : null
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const menu = MEGA_MENUS.find(m => m.key === open) ?? null
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current) }
  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(null), CLOSE_DELAY_MS)
  }, [])
  const close = useCallback(() => { cancelClose(); setOpen(null); setMobileOpen(false) }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  return (
    <motion.header
      initial={false}
      animate={{ y: visible || open || mobileOpen ? 0 : -130 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="fixed inset-x-0 top-4 z-50 flex flex-col items-center px-4"
      onMouseLeave={scheduleClose}
      onMouseEnter={cancelClose}
    >
      <nav
        aria-label="Main"
        className={cn(
          // Compact pill sized to its content (not stretched edge to edge)
          'flex w-full items-center justify-between gap-7 rounded-full bg-paper/80 py-2 pl-5 pr-2 backdrop-blur-xl transition-shadow duration-300 md:w-auto md:justify-start',
          scrolled || open
            ? 'shadow-[0_0_0_1px_rgb(23_19_16/0.06),0_18px_40px_-22px_rgb(23_19_16/0.45)]'
            : 'shadow-[0_0_0_1px_rgb(23_19_16/0.05)]',
        )}
      >
        <Logo size={24} />

        <ul className="hidden items-center gap-5.5 md:flex">
          {MEGA_MENUS.map(m => (
            <li key={m.key}>
              <button
                type="button"
                aria-expanded={open === m.key}
                onMouseEnter={() => { cancelClose(); setOpen(m.key) }}
                onFocus={() => setOpen(m.key)}
                onClick={() => setOpen(o => (o === m.key ? null : m.key))}
                className={cn('flex items-center gap-1 font-sans text-sm font-bold transition-colors', open === m.key ? 'text-ink' : 'text-ink-2 hover:text-ink')}
              >
                {m.label}
                <motion.svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  className="size-3"
                  animate={{ rotate: open === m.key ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              </button>
            </li>
          ))}
          {NAV_LINKS.map(l => (
            <li key={l.href} onMouseEnter={scheduleClose}>
              <Link href={l.href} className="font-sans text-sm font-bold text-ink-2 transition-colors hover:text-ink">{l.label}</Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Button href="/host" kind="ghost" size="sm">Host an event</Button>
          <Button href="/app" size="sm">Get the app</Button>
        </div>

        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full bg-ink text-cream md:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(o => !o)}
        >
          <span className="relative block h-3 w-4">
            <span className={cn('absolute left-0 top-0 h-0.5 w-4 bg-current transition-transform', mobileOpen && 'translate-y-[5px] rotate-45')} />
            <span className={cn('absolute bottom-0 left-0 h-0.5 w-4 bg-current transition-transform', mobileOpen && '-translate-y-[5px] -rotate-45')} />
          </span>
        </button>
      </nav>

      <div className="hidden md:block">
        <MegaMenu menu={menu} onNavigate={close} />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="mt-3 w-full rounded-[28px] bg-paper p-6 shadow-pop md:hidden"
          >
            {MEGA_MENUS.map(m => (
              <div key={m.key} className="mb-5">
                <div className="mb-2 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">{m.label}</div>
                <div className="flex flex-wrap gap-2">
                  {m.columns[0].links.map(l => (
                    <Link key={l.href} href={l.href} onClick={close} className="rounded-full bg-ink/5 px-3.5 py-2 font-sans text-sm font-bold">{l.label}</Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(l => <Link key={l.href} href={l.href} onClick={close} className="py-2 font-display text-2xl font-extrabold">{l.label}</Link>)}
            </div>
            <Button href="/app" className="mt-5 w-full justify-center">Get the app</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
