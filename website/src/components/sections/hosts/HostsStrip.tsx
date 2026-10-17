import Link from 'next/link'
import type { PublicHostCard } from '@/lib/api'
import { AvatarImage } from '@/components/ui/AvatarImage'

/**
 * "The people hosting here": a row of real host faces linking to each profile,
 * plus a link to the full hosts page. Renders nothing when there are no hosts.
 */
export function HostsStrip({ hosts, total, place, href }: { hosts: PublicHostCard[]; total: number; place: string; href: string }) {
  if (!hosts.length) return null
  return (
    <section className="bg-paper px-6 py-16 md:px-20">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">Hosts near you</div>
          <h2 className="mt-2 font-display text-[clamp(32px,3.6vw,52px)] font-extrabold leading-[0.95] tracking-[-0.05em]">
            The people hosting in {place}.
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex">
            {hosts.slice(0, 6).map((h, i) => (
              <Link
                key={h.username}
                href={`/h/${h.username}`}
                title={h.name ?? h.username}
                className="relative -ml-3 size-14 overflow-hidden rounded-full bg-tile ring-4 ring-paper transition-transform duration-300 first:ml-0 hover:-translate-y-1.5 md:size-16"
                style={{ zIndex: 10 - i }}
              >
                <AvatarImage src={h.avatar} name={h.name ?? h.username} sizes="64px" />
              </Link>
            ))}
          </div>
          <Link href={href} className="rounded-full bg-ink px-5 py-3 font-sans text-sm font-bold text-cream transition-transform hover:-translate-y-0.5">
            Meet all {total} {total === 1 ? 'host' : 'hosts'} →
          </Link>
        </div>
      </div>
    </section>
  )
}
