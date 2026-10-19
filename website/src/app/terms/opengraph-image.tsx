import { OG_SIZE, OG_TYPE, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'Terms of Service'

export default function Image() {
  return ogImage({ kicker: 'Legal', title: 'Terms of Service' })
}
