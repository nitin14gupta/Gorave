import { OG_SIZE, OG_TYPE, ogForPath, ogImage } from '@/lib/og'

export const size = OG_SIZE
export const contentType = OG_TYPE
export const alt = 'House parties and nights out on Gorave'

export default async function Image({ params }: { params: Promise<Record<string, string>> }) {
  const { city, facet, sub } = await params
  return ogImage(ogForPath(city, facet, sub))
}
