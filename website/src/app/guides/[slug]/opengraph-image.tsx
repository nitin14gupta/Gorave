import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'
import { getOutGuide, questionOf } from '@/lib/goingOut'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'A Gorave going-out guide'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const g = getOutGuide('going-out', (await params).slug)
  return ogImage({ kicker: `Going-out guide · ${g?.readMinutes ?? 3} min`, title: g ? questionOf(g) : 'Going-out guides' })
}
