import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getGuide, guideHref, HOST_GUIDES } from '@/lib/hostGuides'
import { PHOTOS } from '@/constants'
import { absoluteUrl } from '@/lib/seo'
import { GuideArticle } from '@/components/sections/guides/GuideArticle'

export const dynamicParams = false

export function generateStaticParams() {
  return HOST_GUIDES.map(g => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: PageProps<'/host/guides/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return {}
  const url = absoluteUrl(guideHref(slug))
  return {
    title: guide.title,
    description: guide.dek,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: guide.title,
      description: guide.dek,
      url,
      images: [{ url: `${PHOTOS[guide.hero]}?w=1200&h=630&fit=crop&q=75&auto=format`, width: 1200, height: 630 }],
    },
  }
}

export default async function HostGuidePage({ params }: PageProps<'/host/guides/[slug]'>) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()
  return <GuideArticle guide={guide} />
}
