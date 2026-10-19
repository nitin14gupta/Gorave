import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'Open your door. Keep 90%.'

export default function Image() {
  return ogImage({ kicker: 'Host on Gorave', title: 'Open your door.', accent: 'Keep 90%.' })
}
