import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'It started with an empty apartment.'

export default function Image() {
  return ogImage({ kicker: 'The founders', title: 'It started with', accent: 'an empty apartment.' })
}
