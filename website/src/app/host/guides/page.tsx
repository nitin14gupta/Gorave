import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/seo'
import { GuidesHubA } from '@/components/sections/guides/GuidesHubA'
import { GuidesHubB } from '@/components/sections/guides/GuidesHubB'

// Locked after comparing both in /lab/guides?v=a|b.
export const GUIDES_VARIANT: 'a' | 'b' = 'a'

const title = 'Hosting guides · Gorave'
const description =
  'Practical guides for hosting house parties, rooftops, game nights and dinner parties in India: planning the night, setting the crowd mix, pricing tickets, house rules, neighbours and QR check-in.'

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: absoluteUrl('/host/guides') },
  openGraph: { title, description, url: absoluteUrl('/host/guides') },
}

export default function HostGuidesPage() {
  return GUIDES_VARIANT === 'a' ? <GuidesHubA /> : <GuidesHubB />
}
