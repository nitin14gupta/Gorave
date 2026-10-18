import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/seo'
import { HelpHub } from '@/components/sections/help/HelpHub'

const title = 'Help centre'
const description = 'Answers about Gorave: request to join, booking and payments, refunds, the address, crowd mix, SOS and safety, hosting and payouts.'

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: absoluteUrl('/help') },
  openGraph: { title: `${title} · Gorave`, description, url: absoluteUrl('/help') },
}

export default function HelpPage() {
  return <HelpHub />
}
