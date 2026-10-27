'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { cn } from '@/lib/utils'
import { ThemeLogo } from './ThemeLogo'

// One icon per type in a soft circle; the pill itself uses the theme tokens
// so it reads on cream and on Noir. No orange.
const BADGE_STYLES = {
  default: 'bg-surface-muted text-ink-primary',
  success: 'bg-offer-green/15 text-offer-green',
  error: 'bg-destructive/15 text-destructive',
}

export function ToastOverlay() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex flex-col items-end justify-end gap-2 p-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
            className="pointer-events-auto flex w-fit max-w-sm items-center gap-3 rounded-full border border-divider bg-elevated py-2 pl-2 pr-4 glow-shadow"
          >
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full', BADGE_STYLES[toast.type])}>
              {toast.type === 'success' ? (
                <Check className="h-4 w-4" strokeWidth={2.6} />
              ) : toast.type === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <ThemeLogo className="h-4 w-4" />
              )}
            </span>
            <span className="flex-1 font-sans text-sm font-semibold text-ink-primary">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-full p-0.5 text-ink-secondary opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
