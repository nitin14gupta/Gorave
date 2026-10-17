import type { CrowdVariant, CrowdViewProps } from './types'
import { CrowdPageA } from './CrowdPageA'
import { CrowdPageB } from './CrowdPageB'
import { CrowdPageC } from './CrowdPageC'

// The variant the live crowd pages use. Change after picking in /lab/crowd.
export const CROWD_VARIANT: CrowdVariant = 'a'

const VARIANTS = { a: CrowdPageA, b: CrowdPageB, c: CrowdPageC }

export function CrowdPageView({ variant = CROWD_VARIANT, ...props }: CrowdViewProps & { variant?: CrowdVariant }) {
  const Page = VARIANTS[variant]
  return <Page {...props} />
}
