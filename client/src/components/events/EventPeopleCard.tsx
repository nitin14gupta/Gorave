import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Mars, Scale, Users, Venus } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { crowdSplit } from '@/lib/crowdMix'
import type { EventDetail } from '@/api/apiService'

// Seat colours, shared with the crowd-mix picker.
export const WOMEN_COLOR = '#FF7AA8'
export const MEN_COLOR = '#7AB8FF'

/** A bar that fills to `pct` (0–1) the first time it shows. */
function Fill({ pct, color }: { pct: number; color: string }) {
  const w = useSharedValue(0)
  useEffect(() => {
    w.value = withTiming(Math.max(0, Math.min(1, pct)), { duration: 700, easing: Easing.out(Easing.cubic) })
  }, [pct, w])
  const st = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }))
  return (
    <View style={s.track}>
      <Animated.View style={[s.fill, { backgroundColor: color }, st]} />
    </View>
  )
}

function Side({ label, Icon, color, going, total, left }: { label: string; Icon: typeof Venus; color: string; going: number; total: number; left: number }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={s.sideHead}>
        <View style={s.sideLabel}>
          <Icon size={13} color={color} strokeWidth={2.4} />
          <Text style={s.sideLabelText}>{label}</Text>
        </View>
        <Text style={[s.sideLeft, { color }]}>{left <= 0 ? 'Full' : `${left} left`}</Text>
      </View>
      <Fill pct={total ? going / total : 0} color={color} />
      <Text style={s.sideSub}>{going} of {total} filled</Text>
    </View>
  )
}

/**
 * Who's coming. Headline count, then one bar per side of the crowd mix
 * (women / men) filling up, with what's left on each. Open crowds get a
 * single bar; women-only or men-only get one bar in that side's colour.
 */
export function EventPeopleCard({ event }: { event: EventDetail }) {
  const cap = Math.max(1, event.capacity || event.attendee_count + event.spots_left)
  const going = event.attendee_count
  const left = Math.max(0, event.spots_left)
  const r = event.ratio
  const pct = event.women_pct
  const mixed = r && pct != null && pct > 0 && pct < 100
  const split = mixed ? crowdSplit(cap, pct) : null

  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={s.headIcon}><Users size={18} color={Colors.inkPrimary} strokeWidth={2} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.going}>{going} going</Text>
          <Text style={s.sub}>{left > 0 ? `${left} ${left === 1 ? 'spot' : 'spots'} left of ${cap}` : `Full · ${cap} spots`}</Text>
        </View>
      </View>

      {mixed && split && r ? (
        <>
          <View style={s.sides}>
            {/* women_left / men_left include the shared open pool (server/utils/seats.py), so each
                bar fills against its own quota while the label shows what that side can still take. */}
            <Side label="Women" Icon={Venus} color={WOMEN_COLOR} left={r.women_left} total={split.women} going={Math.max(0, split.women - Math.max(0, r.women_left - r.open_left))} />
            <Side label="Men" Icon={Mars} color={MEN_COLOR} left={r.men_left} total={split.men} going={Math.max(0, split.men - Math.max(0, r.men_left - r.open_left))} />
          </View>
          <View style={s.note}>
            <Scale size={13} color={Colors.inkSecondary} strokeWidth={2} />
            <Text style={s.noteText}>
              Host set a {pct}:{100 - pct} room{split.open ? `, plus ${split.open} open ${split.open === 1 ? 'spot' : 'spots'} for anyone` : ''}.
            </Text>
          </View>
        </>
      ) : (
        <View style={{ marginTop: 16 }}>
          <Fill pct={going / cap} color={pct != null && pct >= 100 ? WOMEN_COLOR : pct === 0 ? MEN_COLOR : Colors.brandOrange} />
          {pct != null && (pct >= 100 || pct === 0) && (
            <View style={[s.note, { marginTop: 12 }]}>
              {pct >= 100 ? <Venus size={13} color={WOMEN_COLOR} strokeWidth={2.4} /> : <Mars size={13} color={MEN_COLOR} strokeWidth={2.4} />}
              <Text style={s.noteText}>{pct >= 100 ? 'A women-only night.' : 'A men-only night.'}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.divider, padding: 16, marginBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  going: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary, letterSpacing: -0.4 },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 1 },
  sides: { flexDirection: 'row', gap: 14, marginTop: 16 },
  sideHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sideLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sideLabelText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  sideLeft: { fontFamily: FontFamily.bodySemiBold, fontSize: 13 },
  sideSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 6 },
  track: { height: 10, borderRadius: 999, backgroundColor: Colors.surfaceMuted, overflow: 'hidden', marginTop: 8 },
  fill: { height: '100%', borderRadius: 999 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.05) },
  noteText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, lineHeight: 17 },
})
