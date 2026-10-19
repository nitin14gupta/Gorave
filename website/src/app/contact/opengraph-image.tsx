import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'Say hi. We read everything.'

export default function Image() {
  return ogImage({ kicker: 'Contact', title: 'Say hi.', accent: 'We read everything.' })
}
