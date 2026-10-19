import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'Rising to Legend, night by night.'

export default function Image() {
  return ogImage({ kicker: 'Host badges', title: 'Rising to Legend,', accent: 'night by night.' })
}
