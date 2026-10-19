import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'Protected, door to door.'

export default function Image() {
  return ogImage({ kicker: 'Safety', title: 'Protected,', accent: 'door to door.' })
}
