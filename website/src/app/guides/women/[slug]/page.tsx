import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PHOTOS } from '@/constants'
import { WOMEN, getOutGuide, outGuideHref } from '@/lib/goingOut'
import { absoluteUrl } from '@/lib/seo'
import { OutGuideArticle } from '@/components/sections/goingOut/OutGuideArticle'

export const dynamicParams = false
export const generateStaticParams = () => WOMEN.map(g => ({ slug: g.slug }))

export async function generateMetadata({ params }: PageProps<'/guides/women/[slug]'>): Promise<Metadata> {
  const g = getOutGuide('women', (await params).slug)
  if (!g) return {}
  const url = absoluteUrl(outGuideHref(g))
  const img = PHOTOS[g.hero]
  return {
    title: g.title, description: g.dek,
    alternates: { canonical: url },
    openGraph: { title: g.title, description: g.dek, url, type: 'article', images: [img.startsWith('http') ? `${img}?w=1200&q=75&auto=format` : absoluteUrl(img)] },
  }
}

export default async function WomenGuidePage({ params }: PageProps<'/guides/women/[slug]'>) {
  const g = getOutGuide('women', (await params).slug)
  if (!g) notFound()
  return <OutGuideArticle guide={g} />
}
