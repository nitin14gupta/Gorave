import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'House parties, hosted by real people.'

export default function Image() {
  return ogImage({ kicker: 'Gorave', title: 'House parties,', accent: 'hosted by real people.' })
}
