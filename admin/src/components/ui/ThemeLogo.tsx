import { cn } from '@/lib/utils'

/**
 * The Open Seat mark: cream ring on the dark theme, black ring on the light
 * one, orange dot on both. Both render and CSS picks one from <html data-theme>,
 * so it never flashes.
 */
export function ThemeLogo({ className }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/seal-cream.svg" alt="Gorave" className={cn('shrink-0 light:hidden', className)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/seal-black.svg" alt="Gorave" className={cn('hidden shrink-0 light:block', className)} />
    </>
  )
}

/**
 * "gorave" in the brand lettering: cream on the dark theme, black on the
 * light one. Both render and CSS picks one from <html data-theme>, so it
 * never flashes. Width follows the height (the wordmark is about 4:1).
 */
export function ThemeWordmark({ className }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/wordmark-cream.svg" alt="gorave" className={cn('w-auto shrink-0 light:hidden', className)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/wordmark-black.svg" alt="gorave" className={cn('hidden w-auto shrink-0 light:block', className)} />
    </>
  )
}
