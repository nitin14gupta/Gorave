import Image from 'next/image'
import Link from 'next/link'
import { BRAND, type SampleEvent } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { EventCard } from '@/components/ui/EventCard'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { Stagger } from '@/components/sections/type/Stagger'
import { MemberPhotos } from './MemberPhotos'

export interface MemberData {
  name: string
  username: string
  city: string | null
  bio: string | null
  photos: string[]
  interests: { name: string; emoji: string | null }[]
  badges: string[]
  hostBadge: keyof typeof BRAND.badges | null
  followers: number
  following: number
  hosted: number
  rating: number | null
  reviews: number
  verified: boolean
  since: string | null
}

/** A seal with a tick, drawn inline like the rest of the site's icons. */
function VerifiedTick() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5l2.4 1.8 3-.2.9 2.9 2.4 1.8-1 2.8 1 2.8-2.4 1.8-.9 2.9-3-.2L12 21.5l-2.4-1.8-3 .2-.9-2.9-2.4-1.8 1-2.8-1-2.8 2.4-1.8.9-2.9 3 .2z" />
      <path d="M8.5 12.2l2.4 2.3 4.6-4.8" />
    </svg>
  )
}

const count = (n: number) => (n >= 10_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : String(n))

/** gorave.in/u/username: anyone's profile, as much as is safe to show without a login. */
export function MemberProfileView({ member, events, appLink }: { member: MemberData; events: SampleEvent[]; appLink: string }) {
  const first = member.name.split(' ')[0]
  const stats = [
    { value: count(member.followers), label: member.followers === 1 ? 'follower' : 'followers' },
    { value: count(member.following), label: 'following' },
    ...(member.hosted ? [{ value: String(member.hosted), label: member.hosted === 1 ? 'night hosted' : 'nights hosted' }] : []),
    ...(member.hosted && member.reviews && member.rating ? [{ value: member.rating.toFixed(1), label: `host rating` }] : []),
  ]

  return (
    <>
      <main>
        <section className="bg-cream px-6 pb-20 pt-28 md:px-20 md:pb-28 md:pt-36">
          <div className="mx-auto grid max-w-[1180px] items-start gap-12 md:grid-cols-[minmax(0,460px)_1fr] md:gap-20">
            <div className="md:sticky md:top-28">
              <MemberPhotos photos={member.photos} name={member.name} />
            </div>

            <div className="min-w-0 md:pt-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-sans text-sm font-bold uppercase tracking-[0.18em] text-ink-3">
                <span>On Gorave · @{member.username}</span>
                {member.verified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs tracking-[0.12em] text-ink shadow-soft">
                    <VerifiedTick /> ID verified
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 break-words font-display text-[clamp(52px,8vw,120px)] font-extrabold leading-[0.88] tracking-[-0.06em]">{member.name}</h1>

              <p className="mt-4 font-sans text-lg text-ink-2">
                {[member.city, member.since ? `on Gorave since ${member.since}` : null].filter(Boolean).join(' · ')}
              </p>

              {member.bio ? (
                <p className="mt-8 max-w-[560px] font-serif text-[clamp(26px,2.6vw,36px)] italic leading-[1.2] text-ink">“{member.bio}”</p>
              ) : null}

              <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-6 border-y border-line py-6">
                {stats.map(s => (
                  <div key={s.label}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-display text-[clamp(30px,3vw,44px)] font-extrabold leading-none tracking-[-0.05em] tabular-nums">{s.value}</dd>
                    <dd className="mt-1.5 font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-3">{s.label}</dd>
                  </div>
                ))}
              </dl>

              {member.interests.length ? (
                <div className="mt-9">
                  <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">Into</h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {member.interests.map(i => (
                      <li key={i.name} className="rounded-full bg-white px-4 py-2 font-sans text-[15px] font-semibold text-ink shadow-soft">
                        {i.emoji ? <span aria-hidden className="mr-1.5">{i.emoji}</span> : null}{i.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {member.badges.length || member.hostBadge ? (
                <div className="mt-8">
                  <h2 className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">Badges</h2>
                  <ul className="mt-3 flex flex-wrap items-center gap-2">
                    {member.hostBadge ? (
                      <li>
                        <Link href={`/h/${member.username}`} className="inline-flex items-center gap-2 rounded-full bg-ink py-1.5 pl-1.5 pr-4 font-sans text-[15px] font-semibold text-paper transition-transform hover:-translate-y-px">
                          <span className="relative size-8"><Image src={BRAND.badges[member.hostBadge]} alt="" fill sizes="32px" className="object-contain" /></span>
                          <span className="capitalize">{member.hostBadge} host</span>
                        </Link>
                      </li>
                    ) : null}
                    {member.badges.map(b => (
                      <li key={b} className="rounded-full border-[1.5px] border-line px-4 py-2 font-sans text-[15px] font-semibold text-ink">{b}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-10 flex flex-wrap gap-2.5">
                {/* The app's own link: opens their profile if Gorave is installed. */}
                <Button href={appLink} size="lg">Open in Gorave</Button>
                <Button href="/app" kind="ghost" size="lg">Get the app</Button>
              </div>

              <p className="mt-6 max-w-[480px] font-sans text-sm text-ink-3">
                {first}&apos;s age and the nights they&apos;re going to stay private. Follow or send a vibe from the app.
              </p>
            </div>
          </div>
        </section>

        {events.length ? (
          <section className="bg-paper px-6 py-24 md:px-20 md:py-28">
            <div className="mx-auto max-w-[1180px]">
              <Chapter n="01" title="Hosting" />
              <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
                <h2 className="font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">{first}&apos;s next nights.</h2>
                <Button href={`/h/${member.username}`} kind="ghost">See their host page</Button>
              </div>
              <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map(e => <EventCard key={e.id} event={e} />)}
              </Stagger>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
