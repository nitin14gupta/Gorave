import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { BadgeCheck } from 'lucide-react-native'
import { Colors } from '@/constants'

/**
 * Next to the name of anyone whose government ID (PAN) a person at Gorave
 * approved. A white seal with a dark check, so it reads on any photo.
 */
export function VerifiedTick({ size = 24 }: { size?: number }) {
  return <BadgeCheck size={size} color={Colors.background} fill={Colors.white} strokeWidth={2.2} accessibilityLabel="ID verified" />
}

/** A name with the tick right after it, when they're verified. The name truncates, the tick never does. */
export function NameWithTick({ name, verified, style, tickSize = 14, rowStyle }: {
  name: string
  verified?: boolean | null
  style?: StyleProp<TextStyle>
  tickSize?: number
  rowStyle?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[s.row, rowStyle]}>
      <Text style={[style, s.shrink]} numberOfLines={1}>{name}</Text>
      {verified ? <VerifiedTick size={tickSize} /> : null}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 0 },
  shrink: { flexShrink: 1 },
})
