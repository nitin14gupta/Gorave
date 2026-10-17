import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/seo'
import { badgeTiers, siteStats } from '@/lib/pagesData'
import { BadgesPageView } from '@/components/sections/evergreen/badges/BadgesPageView'

export const revalidate = 300

const title = 'Host badges on Gorave: Rising, Established, Elite, Legend'
const description = 'Hosts earn badges as they host: Rising at 2 nights, Established at 10, Elite at 25 and Legend at 75. Guests see them on every event.'

export const metadata: Metadata = {
  title: { absolute: title }, description,
  alternates: { canonical: absoluteUrl('/host/badges') },
  openGraph: { title, description, url: absoluteUrl('/host/badges') },
}

export default async function BadgesRoute() {
  return <BadgesPageView {...{ tiers: await badgeTiers(), stats: await siteStats() }} />
}
