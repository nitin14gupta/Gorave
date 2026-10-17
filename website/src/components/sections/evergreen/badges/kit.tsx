import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { BRAND } from '@/constants'
import type { PublicHostCard } from '@/lib/api'
import type { BadgeTier } from '@/lib/pagesData'
import type { Crumb } from '@/lib/seo'
import { AvatarImage } from '@/components/ui/AvatarImage'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

// Shared bits for both variants of the host badges page.

export const EASE = [0.2, 0.8, 0.2, 1] as const
export const EASE_CSS = 'cubic-bezier(.2,.8,.2,1)'

/** Display-safe rounding for any number that ends up in an SSR'd inline style. */
export const r2 = (n: number) => Math.round(n * 100) / 100
export const pad = (n: number) => String(n).padStart(2, '0')

export const BADGE_CRUMBS: Crumb[] = [
  { label: 'Home', href: '/' },
  { label: 'Host', href: '/host' },
  { label: 'Badges', href: '/host/badges' },
]

export type TierKey = BadgeTier['key']

/** Look and voice of each tier, colours sampled from the badge artwork. */
export const TIER_LOOK: Record<TierKey, { color: string; tint: string; deep: string; line: string; short: string }> = {
  rising: { color: '#1FA37A', tint: '#DCEFE4', deep: '#0F5A43', line: 'Your first two nights. You are on the board.', short: 'The first step' },
  established: { color: '#5B2D91', tint: '#E9E0F3', deep: '#341659', line: 'Ten nights in. Guests can tell you have done this before.', short: 'A proper regular' },
  elite: { color: '#2E5BD9', tint: '#DCE6F7', deep: '#183A8F', line: 'Twenty-five nights. A fixture on the calendar.', short: 'Top of the room' },
  legend: { color: '#A8642B', tint: '#F4E4CC', deep: '#5E3214', line: 'Seventy-five nights. The top of the ladder.', short: 'The summit' },
}

/** The app's own copy for the first badge push. */
export const RISING_PUSH = "You're a Rising Host now! Keep it up: more hosted events means more visibility for your next one."

export const hostName = (h: PublicHostCard) => h.name ?? h.username

export const CITY_HOSTS = [
  { name: 'Mumbai', href: '/mumbai/hosts' },
  { name: 'Bangalore', href: '/bangalore/hosts' },
  { name: 'Delhi', href: '/delhi/hosts' },
] as const

/** Chapter opener + heading, one rhythm for every section. */
export function Head({ n, label, title, serif, aside, center, className }: {
  n: string
  label: string
  title: ReactNode
  serif?: ReactNode
  aside?: ReactNode
  center?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex gap-x-10 gap-y-5', center ? 'flex-col items-center text-center' : 'flex-wrap items-end justify-between', className)}>
      <div className="max-w-[880px]">
        <Chapter n={n} title={label} className={center ? 'justify-center' : undefined} />
        <h2 className="mt-4 font-display text-[clamp(40px,5.4vw,80px)] font-extrabold leading-[0.92] tracking-[-0.055em] text-ink">
          {title}
          {serif && (
            <>
              <br />
              <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">{serif}</span>
            </>
          )}
        </h2>
      </div>
      {aside && <div className="max-w-[380px] font-sans text-lg leading-relaxed text-ink-2">{aside}</div>}
    </div>
  )
}

/** The real badge artwork. Never redrawn. */
export function BadgeArt({ tier, size, className, priority }: { tier: TierKey; size: number; className?: string; priority?: boolean }) {
  const name = tier[0].toUpperCase() + tier.slice(1)
  return (
    <Image
      src={BRAND.badges[tier]}
      alt={`${name} host badge`}
      width={size}
      height={Math.round(size * 1.06)}
      priority={priority}
      draggable={false}
      className={cn('select-none object-contain', className)}
      style={{ width: size, height: 'auto' }}
    />
  )
}

/** A round host face linking to their profile. */
export function Face({ host, size = 44, ring = 'ring-cream', className }: { host: PublicHostCard; size?: number; ring?: string; className?: string }) {
  const name = hostName(host)
  return (
    <Link
      href={`/h/${host.username}`}
      title={name}
      className={cn('relative block shrink-0 overflow-hidden rounded-full ring-[3px] transition-transform duration-300 ease-out-expo hover:z-10 hover:-translate-y-1 hover:scale-110', ring, className)}
      style={{ width: size, height: size }}
    >
      <AvatarImage src={host.avatar} name={name} sizes={`${size * 2}px`} initialClassName="text-base" />
    </Link>
  )
}

/** "Meet the hosts" row: the three city host lists. */
export function MeetHosts({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      <span className="mr-1 font-sans text-sm font-bold text-ink-3">Meet the hosts in</span>
      {CITY_HOSTS.map(c => (
        <Link
          key={c.href}
          href={c.href}
          className="group inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 font-sans text-sm font-bold text-ink shadow-soft transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
        >
          {c.name}
          <span className="inline-block transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
        </Link>
      ))}
    </div>
  )
}

/** In-context links to the other host pages. */
export const HOST_LINKS = [
  { href: '/host/payouts', label: 'How you get paid', body: 'Ticket pricing, the commission and when the money lands.' },
  { href: '/host/guides', label: 'Hosting guides', body: 'Practical playbooks for your first nights and the ones after.' },
] as const

/** Phone-style push, used for the app's real Rising copy. */
export function Push({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-[22px] bg-white/90 p-3.5 pr-5 shadow-pop backdrop-blur', className)}>
      <div className="relative size-10 shrink-0 overflow-hidden rounded-[11px] bg-ink">
        <Image src={BRAND.logoLight} alt="" fill sizes="40px" className="object-contain p-1.5" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3 font-sans text-[12px] font-bold text-ink-3">
          <span className="uppercase tracking-[0.12em]">Gorave</span>
          <span>now</span>
        </div>
        <div className="mt-0.5 font-sans text-[14px] font-medium leading-snug text-ink">{RISING_PUSH}</div>
      </div>
    </div>
  )
}
