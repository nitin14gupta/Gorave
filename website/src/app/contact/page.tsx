import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/seo'
import { ContactPage } from '@/components/sections/contact/ContactPage'

const description = 'Get in touch with Gorave about a booking, refund, hosting, payouts, safety or your account. A real person replies.'

export const metadata: Metadata = {
  title: 'Contact',
  description,
  alternates: { canonical: absoluteUrl('/contact') },
  openGraph: { title: 'Contact · Gorave', description, url: absoluteUrl('/contact') },
}

export default function Page() {
  return <ContactPage />
}
