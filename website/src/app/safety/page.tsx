import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/seo'
import { SafetyPageA } from '@/components/sections/safety/SafetyPageA'
import { SafetyPageB } from '@/components/sections/safety/SafetyPageB'

/** Which design ships on /safety. Compare both at /lab/safety?v=a|b. */
export const SAFETY_VARIANT: 'a' | 'b' = 'a'

const title = 'Safety on Gorave — how we keep events safe'
const description =
  'Phone-verified 18+ guests, request-to-join, crowd mix and age gates, private addresses that unlock only for confirmed guests, QR check-in, one-tap SOS to 5 contacts, reviews and reporting.'
const url = absoluteUrl('/safety')

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url },
}

const SAFETY_CRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Safety', href: '/safety' },
]

export default function SafetyPage() {
  return SAFETY_VARIANT === 'b' ? <SafetyPageB crumbs={SAFETY_CRUMBS} /> : <SafetyPageA crumbs={SAFETY_CRUMBS} />
}
