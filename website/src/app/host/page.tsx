import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/seo'
import { HostPageA } from '@/components/sections/host/HostPageA'
import { HostPageB } from '@/components/sections/host/HostPageB'

/** Which design is live. Compare both at /lab/host?v=a|b before changing. */
export const HOST_VARIANT: 'a' | 'b' = 'a'

const title = 'Host a house party on Gorave'
const description =
  'Create a house party, rooftop, game night or supper club in a few minutes. Free to list, 2 free-entry events a month, or sell tickets from ₹99 and keep 90%. Approve every guest, set the crowd mix, scan QR tickets at the door.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl('/host') },
  openGraph: { title, description, url: absoluteUrl('/host') },
}

export default function HostPage() {
  return HOST_VARIANT === 'a' ? <HostPageA /> : <HostPageB />
}
