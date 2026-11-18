import Image from 'next/image'
import Link from 'next/link'
import { BRAND } from '@/constants'
import { cn } from '@/lib/cn'

/** The seal and the wordmark. `dark` is for noir backgrounds (cream wordmark). */
export function Logo({ dark = false, size = 26, className }: { dark?: boolean; size?: number; className?: string }) {
  // The wordmark is about 4:1; at 0.74 of the seal's height it lines up with the g.
  const wordH = Math.round(size * 0.74)
  return (
    <Link href="/" aria-label="Gorave home" className={cn('flex items-center gap-2', className)}>
      <Image src={BRAND.logoDark} alt="" width={size} height={size} priority unoptimized />
      <Image
        src={dark ? BRAND.wordmarkCream : BRAND.wordmark}
        alt="gorave"
        width={Math.round(wordH * (2000 / 502))}
        height={wordH}
        priority
        unoptimized
      />
    </Link>
  )
}
