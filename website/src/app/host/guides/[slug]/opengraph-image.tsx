import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'
import { getGuide } from '@/lib/hostGuides'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'A Gorave hosting guide'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGuide((await params).slug)
  return ogImage({ kicker: `Hosting guide · ${g?.readMinutes ?? 5} min`, title: g?.title ?? 'Hosting guides' })
}
