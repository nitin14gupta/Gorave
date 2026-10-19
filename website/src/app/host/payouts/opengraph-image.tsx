import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'You throw the night. We handle the money.'

export default function Image() {
  return ogImage({ kicker: 'Payouts', title: 'You throw the night.', accent: 'We handle the money.' })
}
