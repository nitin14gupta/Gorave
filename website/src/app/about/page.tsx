import type { Metadata } from 'next'
import { absoluteUrl, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/ui/JsonLd'
import { TEAM } from '@/components/sections/evergreen/about/team'
import { cityCounts, featuredEvents, siteStats } from '@/lib/pagesData'
import { AboutPageView } from '@/components/sections/evergreen/about/AboutPageView'

export const revalidate = 300

const title = 'About Gorave'
const description = 'Gorave is where real people host house parties, rooftops, game nights and dinners in their homes, and where you find them. Built for Gen-Z India.'

export const metadata: Metadata = {
  title: { absolute: title }, description,
  alternates: { canonical: absoluteUrl('/about') },
  openGraph: { title, description, url: absoluteUrl('/about') },
}

export default async function AboutRoute() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    url: absoluteUrl('/about'),
    mainEntity: {
      '@type': 'Organization',
      name: 'Gorave',
      url: SITE_URL,
      founder: TEAM.map(f => ({ '@type': 'Person', name: f.name, jobTitle: f.role, image: absoluteUrl(f.photo) })),
    },
  }
  return (
    <>
      <JsonLd data={ld} />
      <AboutPageView {...{ stats: await siteStats(), cities: await cityCounts(), events: await featuredEvents() }} />
    </>
  )
}
