import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { hTap } from '@/lib/haptics'
import { ShimmerText } from './ShimmerText'

interface Props {
  title: string
  /** e.g. "See all", "Show less" — omit for a title-only header */
  actionLabel?: string
  onAction?: () => void
  /** Small element before the title (live dot, icon) */
  leading?: ReactNode
  style?: StyleProp<ViewStyle>
}

// One header for every list section in the app: the title stays solid, only
// the action shimmers — so the sweep always means "there's more, tap here"
// instead of decorating every heading at once.
export function SectionHeader({ title, actionLabel, onAction, leading, style }: Props) {
  return (
    <View style={[s.row, style]}>
      <View style={s.titleRow}>
        {leading}
        <Text style={s.title} numberOfLines={1}>{title}</Text>
      </View>
      {actionLabel && onAction ? (
        <Pressable style={s.action} onPress={() => { hTap(); onAction() }} hitSlop={10}>
          <ShimmerText style={s.actionText}>{actionLabel}</ShimmerText>
          <ChevronRight size={14} color={Colors.inkSecondary} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary, flexShrink: 1 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkPrimary },
})
