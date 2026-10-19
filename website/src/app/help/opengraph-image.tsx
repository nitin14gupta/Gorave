import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'How can we help?'

export default function Image() {
  return ogImage({ kicker: 'Help centre', title: 'How can', accent: 'we help?' })
}
