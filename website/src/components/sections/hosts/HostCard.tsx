import Image from 'next/image'
import Link from 'next/link'
import { BRAND } from '@/constants'
import type { PublicHostCard } from '@/lib/api'
import { AvatarImage } from '@/components/ui/AvatarImage'

type BadgeKey = keyof typeof BRAND.badges

/** One host in a list: photo, badge, track record, where they host. Links to their profile. */
export function HostCard({ host }: { host: PublicHostCard }) {
  const badge = host.badges.at(-1)?.toLowerCase() as BadgeKey | undefined
  const name = host.name ?? host.username
  return (
    <Link
      href={`/h/${host.username}`}
      className="group block rounded-[28px] bg-white p-4 shadow-soft transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1.5 hover:shadow-pop"
    >
      <div className="relative aspect-square overflow-hidden rounded-[20px] bg-tile">
        <AvatarImage src={host.avatar} name={name} sizes="(max-width: 640px) 50vw, 25vw" className="transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.05]" initialClassName="text-6xl" />
        {badge && BRAND.badges[badge] && (
          <div className="absolute bottom-2 right-2 size-14">
            <Image src={BRAND.badges[badge]} alt={`${host.badges.at(-1)} host`} fill sizes="56px" className="object-contain drop-shadow-lg" />
          </div>
        )}
      </div>
      <div className="px-1 pt-3.5">
        <div className="font-display text-xl font-extrabold leading-tight tracking-[-0.03em]">{name}</div>
        <div className="mt-1 font-sans text-[13px] text-ink-3">
          {host.hosted_count} {host.hosted_count === 1 ? 'night' : 'nights'} hosted
          {host.review_count > 0 && host.avg_rating ? ` · ★ ${host.avg_rating}` : ''}
        </div>
        <div className="mt-2.5 flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className="max-w-full truncate font-sans text-xs font-bold text-ink-2">{host.areas.slice(0, 2).join(' · ')}</span>
          {host.upcoming_count > 0 && <span className="shrink-0 rounded-full bg-cream px-2.5 py-1 font-sans text-[11px] font-bold">{host.upcoming_count} coming up</span>}
        </div>
      </div>
    </Link>
  )
}
