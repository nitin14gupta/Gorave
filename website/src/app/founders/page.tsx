import type { Metadata } from 'next'
import { TEAM, founderHref } from '@/lib/founders'
import { absoluteUrl, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/ui/JsonLd'
import { FoundersPageView } from '@/components/sections/founders/FoundersPageView'

const title = 'The founders of Gorave'
const description = 'How Gorave started: an empty apartment, a party where nobody talked, and two friends building a better way to meet people. Meet Nitin Gupta and Kaveesha Jeswani.'

export const metadata: Metadata = {
  title: { absolute: title }, description,
  alternates: { canonical: absoluteUrl('/founders') },
  openGraph: { title, description, url: absoluteUrl('/founders') },
}

export default function Page() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Gorave',
    url: SITE_URL,
    founder: TEAM.map(f => ({ '@type': 'Person', name: f.name, jobTitle: f.role, url: absoluteUrl(founderHref(f)), image: absoluteUrl(f.photo), sameAs: f.links.map(l => l.href) })),
  }
  return (
    <>
      <JsonLd data={ld} />
      <FoundersPageView />
    </>
  )
}
