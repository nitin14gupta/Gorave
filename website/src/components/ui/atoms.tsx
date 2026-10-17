import Image from 'next/image'
import type { ReactNode } from 'react'
import { AVATARS, APP_LINKS } from '@/constants'
import { cn } from '@/lib/cn'

export function Eyebrow({ children, dark, className }: { children: ReactNode; dark?: boolean; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-[0.14em]', dark ? 'text-noir-ink-2' : 'text-ink-3', className)}>
      <span className="size-[7px] rounded-full bg-brand" />
      {children}
    </div>
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-sans text-xs font-bold', className)}>
      {children}
    </span>
  )
}

export function AvatarStack({ n = 4, size = 28, ringClass = 'ring-cream' }: { n?: number; size?: number; ringClass?: string }) {
  return (
    <div className="flex">
      {AVATARS.slice(0, n).map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          width={size}
          height={size}
          sizes={`${size * 2}px`}
          className={cn('rounded-full object-cover ring-[2.5px]', ringClass)}
          style={{ marginLeft: i ? -size * 0.32 : 0, width: size, height: size }}
        />
      ))}
    </div>
  )
}

// Official badges (public/img/stores), Apple and Google require the
// artwork unmodified, so they're images, not recreated in CSS.
export function StoreBadges({ height = 48 }: { dark?: boolean; height?: number }) {
  const badges = [
    { href: APP_LINKS.ios, src: '/img/stores/app-store.svg', alt: 'Download on the App Store' },
    { href: APP_LINKS.android, src: '/img/stores/google-play.svg', alt: 'Get it on Google Play' },
  ]
  return (
    <div className="flex gap-2.5">
      {badges.map(b => (
        <a key={b.src} href={b.href} className="block transition-transform duration-300 ease-out-expo hover:-translate-y-0.5">
          <Image src={b.src} alt={b.alt} width={height * 3.375} height={height} style={{ height, width: 'auto' }} />
        </a>
      ))}
    </div>
  )
}

/** Section heading, one size scale for the whole site. */
export function H2({ children, className, dark }: { children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <h2 className={cn('font-display text-[clamp(44px,6vw,84px)] font-extrabold leading-[0.95] tracking-display', dark ? 'text-noir-ink' : 'text-ink', className)}>
      {children}
    </h2>
  )
}

export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('font-sans text-lg leading-relaxed text-ink-2', className)}>{children}</p>
}

/** "01, The reasons": opens each city-page section like a chapter of one night out. */
export function Chapter({ n, title, dark, className }: { n: string; title: string; dark?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-[0.18em]', dark ? 'text-noir-ink-2' : 'text-ink-3', className)}>
      <span className="font-serif text-xl normal-case italic tracking-normal text-orange">{n}</span>
      <span className={cn('h-px w-10', dark ? 'bg-noir-ink/25' : 'bg-ink/25')} />
      {title}
    </div>
  )
}
