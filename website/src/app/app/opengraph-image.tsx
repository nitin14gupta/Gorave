import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'Find a night, or host one.'

export default function Image() {
  return ogImage({ kicker: 'The app', title: 'Find a night,', accent: 'or host one.' })
}
