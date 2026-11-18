import { cn } from '@/lib/utils'

/** The Gorave seal. Its orange-to-coral gradient reads on both themes. */
export function ThemeLogo({ className }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/seal-gradient.svg" alt="Gorave" className={cn('shrink-0', className)} />
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
