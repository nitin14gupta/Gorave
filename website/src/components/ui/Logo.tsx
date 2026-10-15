import Image from 'next/image'
import Link from 'next/link'
import { BRAND } from '@/constants'
import { cn } from '@/lib/cn'

export function Logo({ dark = false, size = 26, className }: { dark?: boolean; size?: number; className?: string }) {
  return (
    <Link href="/" aria-label="Gorave home" className={cn('flex items-center gap-2', className)}>
      <Image src={dark ? BRAND.logoLight : BRAND.logoDark} alt="" width={size} height={size} priority />
      <span
        className={cn('font-display font-extrabold tracking-[-0.04em]', dark ? 'text-noir-ink' : 'text-ink')}
        style={{ fontSize: size * 0.82 }}
      >
        gorave
      </span>
    </Link>
  )
}
