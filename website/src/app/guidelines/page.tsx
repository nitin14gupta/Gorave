import type { Metadata } from 'next'
import { getLegalDoc, legalHref } from '@/lib/legal'
import { absoluteUrl } from '@/lib/seo'
import { LegalPage } from '@/components/sections/legal/LegalPage'

const doc = getLegalDoc('guidelines')!

export const metadata: Metadata = {
  title: doc.title,
  description: doc.line,
  alternates: { canonical: absoluteUrl(legalHref(doc.slug)) },
  openGraph: { title: `${doc.title} · Gorave`, description: doc.line, url: absoluteUrl(legalHref(doc.slug)) },
}

export default function Page() {
  return <LegalPage doc={doc} />
}
