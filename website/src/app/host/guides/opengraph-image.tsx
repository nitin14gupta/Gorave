import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'Throw a night people talk about.'

export default function Image() {
  return ogImage({ kicker: 'Hosting guides', title: 'Throw a night', accent: 'people talk about.' })
}
