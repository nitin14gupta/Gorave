import type { AreaViewProps } from './types'
import { AreaPageB } from './AreaPageB'

// Neighbourhood page — the "Postcards" design (picked in the lab; the
// "Blue hour" and "Night map" variants were retired).
export function AreaPageView(props: AreaViewProps) {
  return <AreaPageB {...props} />
}
