import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/seo'
import { cityCounts, featuredEvents, siteStats } from '@/lib/pagesData'
import { AppPageView } from '@/components/sections/evergreen/app/AppPageView'

export const revalidate = 300

const title = 'Get the Gorave app: house parties near you'
const description = 'Find house parties, rooftops, game nights and dinner parties near you, request or book in a tap, and get your QR ticket. iPhone and Android.'

export const metadata: Metadata = {
  title: { absolute: title }, description,
  alternates: { canonical: absoluteUrl('/app') },
  openGraph: { title, description, url: absoluteUrl('/app') },
}

export default async function AppRoute() {
  return <AppPageView {...{ events: await featuredEvents(), stats: await siteStats(), cities: await cityCounts() }} />
}
