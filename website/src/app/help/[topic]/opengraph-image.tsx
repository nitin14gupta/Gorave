import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'
import { getHelpTopic } from '@/lib/help'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'Gorave help centre'

export default async function Image({ params }: { params: Promise<{ topic: string }> }) {
  const t = getHelpTopic((await params).topic)
  return ogImage({ kicker: 'Help centre', title: t?.title ?? 'Help', accent: t ? `${t.questions.length} answers.` : undefined })
}
