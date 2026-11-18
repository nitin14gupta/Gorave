import { StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { Sparkles, Venus } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { useLabVariant, type LabVariant } from '@/store/labStore'

/**
 * How a women-only night looks on every event card. Four looks are in the
 * design lab (Settings → Design lab → Women-only cards, dev builds). The pick
 * applies app-wide straight away; once one wins, the others get deleted.
 *
 *   a  Rose frame   – a rose ring round the card, solid "Women only" chip
 *   b  Rose glass   – the title area sits on a frosted rose panel
 *   c  Her night    – the photo fades into deep rose, "HER NIGHT" label
 *   d  Invitation   – a double hairline frame, cream "WOMEN ONLY" tag
 */
/** women_pct of 100 means the night is for women only. */
export const isWomenOnly = (womenPct?: number | null) => womenPct != null && womenPct >= 100

export type WomenLook = LabVariant
export const WOMEN_LOOKS: { key: WomenLook; name: string; line: string }[] = [
  { key: 'a', name: 'Rose frame', line: 'Rose ring and a solid chip' },
  { key: 'b', name: 'Rose glass', line: 'Frosted rose panel under the title' },
  { key: 'c', name: 'Her night', line: 'Deep rose fade, "Her night" label' },
  { key: 'd', name: 'Invitation', line: 'Double frame like a printed invite' },
]
export const WOMEN_LAB_KEY = 'women-card'
export const useWomenLook = (): WomenLook => useLabVariant(WOMEN_LAB_KEY)

const ROSE = Colors.womenOnly
const PLUM = '#3A0F2A'
const CREAM = '#F6EBDD'

/** Dark fade over the photo. Look C turns it deep rose. */
export function womenScrim(look: WomenLook, base: string[]): string[] {
  return look === 'c' ? ['transparent', withOpacity(PLUM, 0.6), withOpacity(PLUM, 0.94)] : base
}

/** Drawn over a poster or thumbnail (pointer events pass through). */
export function WomenFrame({ look, radius, thin = false }: { look: WomenLook; radius: number; thin?: boolean }) {
  if (look === 'a') return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: thin ? 2 : 2.5, borderColor: ROSE }]} />
  if (look === 'd') {
    const gap = thin ? 3 : 5
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1.5, borderColor: CREAM }]} />
        <View style={{ position: 'absolute', top: gap, left: gap, right: gap, bottom: gap, borderRadius: Math.max(0, radius - gap), borderWidth: 1, borderColor: withOpacity(ROSE, 0.9) }} />
      </View>
    )
  }
  return null
}

/** The label. `onPhoto` sits on a poster; otherwise it sits in a card's text. */
export function WomenTag({ look, onPhoto = true, style }: { look: WomenLook; onPhoto?: boolean; style?: ViewStyle }) {
  if (look === 'c') {
    return (
      <View style={[t.row, onPhoto ? t.herPhoto : t.herInline, style]}>
        <Sparkles size={onPhoto ? 11 : 12} color={onPhoto ? CREAM : ROSE} strokeWidth={2.2} />
        <Text style={[t.caps, { color: onPhoto ? CREAM : ROSE }]}>HER NIGHT</Text>
      </View>
    )
  }
  if (look === 'd') {
    return (
      <View style={[t.row, t.invite, !onPhoto && t.inviteInline, style]}>
        <Text style={[t.caps, { color: '#7A2E52' }]}>WOMEN ONLY</Text>
      </View>
    )
  }
  if (look === 'b' && onPhoto) {
    return (
      <View style={[t.row, t.glassTag, style]}>
        <Venus size={11} color={Colors.white} strokeWidth={2.4} />
        <Text style={[t.text, { color: Colors.white }]}>Women only</Text>
      </View>
    )
  }
  return (
    <View style={[t.row, onPhoto ? t.solid : t.tint, style]}>
      <Venus size={onPhoto ? 11 : 12} color={onPhoto ? Colors.white : ROSE} strokeWidth={2.4} />
      <Text style={[t.text, { color: onPhoto ? Colors.white : ROSE }]}>Women only</Text>
    </View>
  )
}

/** Look B: the frosted rose panel the title block sits on. */
export const womenGlassPanel: ViewStyle = {
  backgroundColor: withOpacity(ROSE, 0.24),
  borderWidth: StyleSheet.hairlineWidth * 2,
  borderColor: withOpacity(ROSE, 0.7),
  borderRadius: 14,
  padding: 10,
}

/** Row cards (EventListCard): the card's own surface for each look. */
export function womenRowStyle(look: WomenLook): ViewStyle | null {
  if (look === 'a') return { borderWidth: 1.5, borderColor: ROSE }
  if (look === 'b') return { backgroundColor: withOpacity(ROSE, 0.1), borderWidth: 1, borderColor: withOpacity(ROSE, 0.45) }
  if (look === 'd') return { borderWidth: 1, borderColor: withOpacity(CREAM, 0.6) }
  return null
}

/** Map pins: a ring (look D gets two). */
export function womenPinStyle(look: WomenLook): ViewStyle {
  if (look === 'c') return { borderWidth: 2.5, borderColor: '#8E2A5E' }
  if (look === 'd') return { borderWidth: 2, borderColor: CREAM }
  return { borderWidth: 2.5, borderColor: ROSE }
}

const t = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 999 },
  text: { fontFamily: FontFamily.bodySemiBold, fontSize: 11 },
  caps: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.6 },
  solid: { backgroundColor: withOpacity(ROSE, 0.95), paddingHorizontal: 8, paddingVertical: 4 },
  tint: { backgroundColor: withOpacity(ROSE, 0.14), paddingHorizontal: 7, paddingVertical: 2 },
  glassTag: { backgroundColor: withOpacity(ROSE, 0.55), borderWidth: StyleSheet.hairlineWidth * 2, borderColor: withOpacity(Colors.white, 0.5), paddingHorizontal: 8, paddingVertical: 4 },
  herPhoto: { backgroundColor: withOpacity(PLUM, 0.75), borderWidth: StyleSheet.hairlineWidth * 2, borderColor: withOpacity(CREAM, 0.35), paddingHorizontal: 9, paddingVertical: 4 },
  herInline: { paddingVertical: 1 },
  invite: { backgroundColor: CREAM, paddingHorizontal: 10, paddingVertical: 4 },
  inviteInline: { paddingHorizontal: 8, paddingVertical: 2 },
})
