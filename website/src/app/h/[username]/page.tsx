import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { fetchHost, toCardEvent } from '@/lib/api'
import { absoluteUrl } from '@/lib/seo'
import { JsonLd } from '@/components/ui/JsonLd'
import { HostProfileView, type BadgeKey } from '@/components/sections/profile/HostProfileView'

// Public host profiles, rendered on demand (any username), cached by the API fetch.
export const revalidate = 60

const getHost = cache((username: string) => fetchHost(username))

export async function generateMetadata({ params }: PageProps<'/h/[username]'>): Promise<Metadata> {
  const { username } = await params
  const host = await getHost(username)
  if (!host) return { title: 'Host not found', robots: { index: false } }
  const name = host.name ?? host.username
  const title = `${name} (@${host.username}) · hosting on Gorave`
  const description = `${name} has hosted ${host.hosted_count} ${host.hosted_count === 1 ? 'night' : 'nights'}${host.city ? ` in ${host.city}` : ''} on Gorave. See their upcoming house parties and request to join.`
  const url = absoluteUrl(`/h/${host.username}`)
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'profile', images: host.avatar ? [host.avatar] : undefined },
    // Thin profiles (nothing coming up and little history) stay out of the index.
    robots: host.upcoming.length || host.hosted_count >= 2 ? undefined : { index: false, follow: true },
  }
}

export default async function HostProfilePage({ params }: PageProps<'/h/[username]'>) {
  const { username } = await params
  const host = await getHost(username)
  if (!host) notFound()
  const name = host.name ?? host.username
  const top = host.badges.at(-1)?.toLowerCase() as BadgeKey | undefined
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Hosts', href: '/host' },
    { label: name, href: `/h/${host.username}` },
  ]
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: { '@type': 'Person', name, alternateName: `@${host.username}`, image: host.avatar ?? undefined, homeLocation: host.city ?? undefined },
        }}
      />
      <HostProfileView
        crumbs={crumbs}
        events={host.upcoming.map(toCardEvent)}
        host={{
          name, username: host.username, avatar: host.avatar, city: host.city,
          badge: top ?? null, hosted: host.hosted_count, rating: host.avg_rating, reviews: host.review_count, upcoming: host.upcoming.length,
        }}
      />
    </>
  )
}
