import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'Eight cities, so far.'

export default function Image() {
  return ogImage({ kicker: 'Cities', title: 'Eight cities,', accent: 'so far.' })
}
