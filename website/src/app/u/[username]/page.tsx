import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { APP_IDS, BRAND } from '@/constants'
import { fetchMember, toCardEvent } from '@/api/apiService'
import { absoluteUrl } from '@/lib/seo'
import { MemberProfileView } from '@/components/sections/profile/MemberProfileView'

// Anyone's profile, rendered on demand and cached by the API fetch.
export const revalidate = 60

const getMember = cache((username: string) => fetchMember(username))

export async function generateMetadata({ params }: PageProps<'/u/[username]'>): Promise<Metadata> {
  const { username } = await params
  const m = await getMember(username)
  if (!m) return { title: 'Profile not found', robots: { index: false } }
  const name = m.name ?? m.username
  const title = `${name} (@${m.username}) on Gorave`
  const description = m.bio ?? `${name} is on Gorave${m.city ? ` in ${m.city}` : ''}.`
  return {
    title, description,
    alternates: { canonical: absoluteUrl(`/u/${m.username}`) },
    openGraph: { title, description, url: absoluteUrl(`/u/${m.username}`), type: 'profile', images: m.photos[0] ? [m.photos[0]] : undefined },
    // Members are people, not listings: shareable, never in search results.
    robots: { index: false, follow: false },
  }
}

export default async function MemberProfilePage({ params }: PageProps<'/u/[username]'>) {
  const { username } = await params
  const m = await getMember(username)
  if (!m) notFound()
  const level = m.host_badges.at(-1)?.toLowerCase()
  return (
    <MemberProfileView
      appLink={`${APP_IDS.scheme}://profile/${m.username}`}
      events={m.upcoming.map(toCardEvent)}
      member={{
        name: m.name ?? m.username, username: m.username, city: m.city, bio: m.bio, photos: m.photos,
        interests: m.interests, badges: m.badges,
        hostBadge: level && level in BRAND.badges ? (level as keyof typeof BRAND.badges) : null,
        followers: m.followers, following: m.following, hosted: m.hosted_count,
        rating: m.avg_rating, reviews: m.review_count, verified: m.id_verified, since: m.member_since,
      }}
    />
  )
}
