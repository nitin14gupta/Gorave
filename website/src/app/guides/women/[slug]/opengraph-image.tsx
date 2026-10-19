import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'
import { getOutGuide, questionOf } from '@/lib/goingOut'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'A Gorave guide for women'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const g = getOutGuide('women', (await params).slug)
  return ogImage({ kicker: `For women · ${g?.readMinutes ?? 3} min`, title: g ? questionOf(g) : 'Guides for women' })
}
