import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PHOTOS } from '@/constants'
import { OUT_GUIDES, getOutGuide, outGuideHref } from '@/lib/goingOut'
import { absoluteUrl } from '@/lib/seo'
import { OutGuideArticle } from '@/components/sections/goingOut/OutGuideArticle'

export const dynamicParams = false
export const generateStaticParams = () => OUT_GUIDES.map(g => ({ slug: g.slug }))

export async function generateMetadata({ params }: PageProps<'/guides/[slug]'>): Promise<Metadata> {
  const g = getOutGuide('going-out', (await params).slug)
  if (!g) return {}
  const url = absoluteUrl(outGuideHref(g))
  const img = PHOTOS[g.hero]
  return {
    title: g.title, description: g.dek,
    alternates: { canonical: url },
    openGraph: { title: g.title, description: g.dek, url, type: 'article', images: [img.startsWith('http') ? `${img}?w=1200&q=75&auto=format` : absoluteUrl(img)] },
  }
}

export default async function GuidePage({ params }: PageProps<'/guides/[slug]'>) {
  const g = getOutGuide('going-out', (await params).slug)
  if (!g) notFound()
  return <OutGuideArticle guide={g} />
}
