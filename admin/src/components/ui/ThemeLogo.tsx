import { cn } from '@/lib/utils'

/**
 * The Gorave mark: white on the dark theme, black on the light one. Both
 * images render and CSS picks one from <html data-theme>, so it never flashes.
 */
export function ThemeLogo({ className }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/splash-icon.png" alt="Gorave" className={cn('shrink-0 light:hidden', className)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/black-icon.png" alt="Gorave" className={cn('hidden shrink-0 light:block', className)} />
    </>
  )
}
