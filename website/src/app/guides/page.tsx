import type { Metadata } from 'next'
import { absoluteUrl } from '@/lib/seo'
import { GuidesPageView } from '@/components/sections/goingOut/GuidesPageView'

const title = 'Going-out guides: house parties, rooftops and getting home safe'
const description = 'How to pick a night, get accepted, what to bring and wear, house party etiquette, going alone and getting home safe. Practical guides from Gorave.'

export const metadata: Metadata = {
  title: { absolute: title }, description,
  alternates: { canonical: absoluteUrl('/guides') },
  openGraph: { title, description, url: absoluteUrl('/guides') },
}

export default function GuidesPage() {
  return <GuidesPageView />
}
