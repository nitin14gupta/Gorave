import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HELP_TOPICS, getHelpTopic, helpHref } from '@/lib/help'
import { absoluteUrl } from '@/lib/seo'
import { HelpTopicView } from '@/components/sections/help/HelpTopicView'

export const dynamicParams = false
export const generateStaticParams = () => HELP_TOPICS.map(t => ({ topic: t.slug }))

export async function generateMetadata({ params }: PageProps<'/help/[topic]'>): Promise<Metadata> {
  const t = getHelpTopic((await params).topic)
  if (!t) return {}
  const title = `${t.title} · Help`
  const url = absoluteUrl(helpHref(t.slug))
  return { title, description: t.line, alternates: { canonical: url }, openGraph: { title, description: t.line, url } }
}

export default async function HelpTopicPage({ params }: PageProps<'/help/[topic]'>) {
  const t = getHelpTopic((await params).topic)
  if (!t) notFound()
  return <HelpTopicView topic={t} />
}
