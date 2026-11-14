import { BadgeCheck } from 'lucide-react-native'
import { Colors } from '@/constants'

/**
 * Next to the name of anyone whose government ID (PAN) a person at Gorave
 * approved. A white seal with a dark check, so it reads on any photo.
 */
export function VerifiedTick({ size = 24 }: { size?: number }) {
  return <BadgeCheck size={size} color={Colors.background} fill={Colors.white} strokeWidth={2.2} accessibilityLabel="ID verified" />
}
