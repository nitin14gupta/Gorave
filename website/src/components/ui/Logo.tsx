import Image from 'next/image'
import Link from 'next/link'
import { BRAND } from '@/constants'
import { cn } from '@/lib/cn'

/** The Open Seat mark and the wordmark. `dark` is for noir backgrounds (cream ring and wordmark). */
export function Logo({ dark = false, size = 26, className }: { dark?: boolean; size?: number; className?: string }) {
  // Same proportions as the brand lockup: the word sits at 0.9 of the ring's
  // height, centred on it, with a gap of about 0.38 of the ring.
  const wordH = Math.round(size * 0.9)
  return (
    <Link href="/" aria-label="Gorave home" className={cn('flex items-center', className)} style={{ gap: Math.round(size * 0.38) }}>
      <Image src={dark ? BRAND.markCream : BRAND.mark} alt="" width={size} height={size} priority unoptimized />
      <Image
        src={dark ? BRAND.wordmarkCream : BRAND.wordmark}
        alt="gorave"
        width={Math.round(wordH * BRAND.wordmarkAspect)}
        height={wordH}
        priority
        unoptimized
      />
    </Link>
  )
}
