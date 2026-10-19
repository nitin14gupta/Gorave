import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TEAM, founderHref, getFounder } from '@/lib/founders'
import { absoluteUrl, SITE_URL } from '@/lib/seo'
import { JsonLd } from '@/components/ui/JsonLd'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { FounderProfile } from '@/components/sections/founders/FounderProfile'

export const dynamicParams = false
export const generateStaticParams = () => TEAM.map(f => ({ slug: f.slug }))

export async function generateMetadata({ params }: PageProps<'/founders/[slug]'>): Promise<Metadata> {
  const f = getFounder((await params).slug)
  if (!f) return {}
  const title = `${f.name}, ${f.role.split(' · ')[0]} of Gorave`
  const description = f.story[0].slice(0, 155)
  const url = absoluteUrl(founderHref(f))
  return { title: { absolute: title }, description, alternates: { canonical: url }, openGraph: { title, description, url, type: 'profile', images: [absoluteUrl(f.photo)] } }
}

export default async function Page({ params }: PageProps<'/founders/[slug]'>) {
  const f = getFounder((await params).slug)
  if (!f) notFound()
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: { '@type': 'Person', name: f.name, jobTitle: f.role, url: absoluteUrl(founderHref(f)), image: absoluteUrl(f.photo), sameAs: f.links.map(l => l.href), worksFor: { '@type': 'Organization', name: 'Gorave', url: SITE_URL } },
  }
  return (
    <>
      <JsonLd data={ld} />
      <FounderProfile f={f} />
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
