import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/seo'
import { featuredEvents, siteStats } from '@/lib/pagesData'
import { PayoutsPageView } from '@/components/sections/evergreen/payouts/PayoutsPageView'

export const revalidate = 300

const title = 'How payouts work for Gorave hosts'
const description = 'Keep 90% of every ticket, paid to your UPI or bank after the event. Listing is free, tickets start at ₹99 and guests pay a flat ₹50 fee.'

export const metadata: Metadata = {
  title: { absolute: title }, description,
  alternates: { canonical: absoluteUrl('/host/payouts') },
  openGraph: { title, description, url: absoluteUrl('/host/payouts') },
}

export default async function PayoutsRoute() {
  return <PayoutsPageView {...{ stats: await siteStats(), events: await featuredEvents() }} />
}
