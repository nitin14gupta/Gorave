import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'The best nights happen at someone’s place.'

export default function Image() {
  return ogImage({ kicker: 'About', title: 'The best nights', accent: 'happen at someone’s place.' })
}
