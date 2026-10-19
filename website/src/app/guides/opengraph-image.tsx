import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'Everything you’d ask a friend.'

export default function Image() {
  return ogImage({ kicker: 'Going-out guides', title: 'Everything you’d ask', accent: 'a friend.' })
}
