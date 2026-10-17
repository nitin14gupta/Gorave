import type { BadgeTier } from '@/lib/pagesData'
import { AvatarImage } from '@/components/ui/AvatarImage'
import { HoverPreviewList } from '@/components/ui/HoverPreviewList'
import { BadgeArt, Head, TIER_LOOK, hostName } from './kit'

/**
 * Chapter 01, the four badges. The homepage's hover list: hover a badge and a
 * card follows the cursor with the badge and the real hosts wearing it now.
 */
export function WhoWears({ tiers }: { tiers: BadgeTier[] }) {
  const rows = tiers.map(t => ({
    key: t.key,
    href: t.hosts.length ? '#who-holds' : '/host',
    label: (
      <span className="flex items-center gap-4">
        <BadgeArt tier={t.key} size={52} />
        {t.name}
      </span>
    ),
    aside: `${t.at}+ nights · ${t.hosts.length ? `${t.hosts.length >= 6 ? '6+' : t.hosts.length} wearing it` : 'unclaimed'}`,
    preview: (
      <div className="flex size-full flex-col items-center justify-center gap-4 p-5" style={{ background: TIER_LOOK[t.key].tint }}>
        <BadgeArt tier={t.key} size={96} />
        {t.hosts.length ? (
          <div className="flex">
            {t.hosts.slice(0, 4).map((h, i) => (
              <span key={h.username} className="relative -ml-3 size-12 overflow-hidden rounded-2xl bg-tile ring-4 ring-white first:ml-0" style={{ zIndex: 10 - i }}>
                <AvatarImage src={h.avatar} name={hostName(h)} sizes="48px" initialClassName="text-lg" />
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-full bg-white/80 px-3 py-1.5 font-sans text-xs font-bold text-ink">Nobody yet. Be the first.</div>
        )}
        <div className="text-center font-sans text-[13px] font-bold text-ink-2">{t.at}+ events hosted</div>
      </div>
    ),
  }))

  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[1fr_1.4fr]">
        <Head n="01" label="The four badges" title="Four badges." serif="Who's wearing them now." aside="Hover one to see who holds it today." />
        <HoverPreviewList rows={rows} />
      </div>
    </section>
  )
}
