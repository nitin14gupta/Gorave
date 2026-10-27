import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated'
import { Globe, Mars, Minus, Plus, Scale, SlidersHorizontal, Venus, VenusAndMars, type LucideIcon } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { crowdSplit } from '@/lib/crowdMix'
import { hSelection } from '@/lib/haptics'
import { ef } from './styles'

// Seat colours used only for the crowd-mix preview.
const WOMEN = '#FF7AA8'
const MEN = '#7AB8FF'
const OPEN = withOpacity(Colors.inkPrimary, 0.35)

// The choices, as cards. value = women_pct (null = open crowd).
const OPTIONS: { key: string; label: string; sub: string; Icon: LucideIcon; tint: string; value: number | null }[] = [
  { key: 'open', label: 'Open', sub: 'Anyone can join', Icon: Globe, tint: Colors.inkPrimary, value: null },
  { key: '50', label: '50:50', sub: 'Even split', Icon: Scale, tint: Colors.inkPrimary, value: 50 },
  { key: '60', label: '60:40', sub: 'More women', Icon: VenusAndMars, tint: WOMEN, value: 60 },
  { key: '40', label: '40:60', sub: 'More men', Icon: VenusAndMars, tint: MEN, value: 40 },
  { key: 'women', label: 'Women only', sub: 'Just women', Icon: Venus, tint: WOMEN, value: 100 },
  { key: 'men', label: 'Men only', sub: 'Just men', Icon: Mars, tint: MEN, value: 0 },
]

interface Props {
  womenPct: number | null
  capacity: number
  onChange: (v: number | null) => void
  locked?: boolean
  lockNote?: string
  disabled?: boolean
}

/** Share of the room per side, for bars. Open crowd = all neutral. */
function fractions(capacity: number, womenPct: number | null) {
  const split = crowdSplit(capacity, womenPct)
  if (!split) return { w: 0, m: 0, o: 1 }
  const t = Math.max(1, split.women + split.men + split.open)
  return { w: split.women / t, m: split.men / t, o: split.open / t }
}

/** Static mini bar inside each option card. */
function MiniBar({ value }: { value: number | null }) {
  const f = fractions(20, value)
  return (
    <View style={s.mini}>
      {f.w > 0 && <View style={{ flex: f.w, backgroundColor: WOMEN }} />}
      {f.m > 0 && <View style={{ flex: f.m, backgroundColor: MEN }} />}
      {f.o > 0 && <View style={{ flex: f.o, backgroundColor: OPEN }} />}
    </View>
  )
}

/** The big live bar: each side glides to its new share when the mix changes. */
function LiveBar({ capacity, womenPct }: { capacity: number; womenPct: number | null }) {
  const f = fractions(capacity, womenPct)
  const w = useSharedValue(f.w)
  const m = useSharedValue(f.m)
  const o = useSharedValue(f.o)
  useEffect(() => {
    const cfg = { duration: 420, easing: Easing.out(Easing.cubic) }
    w.value = withTiming(f.w, cfg)
    m.value = withTiming(f.m, cfg)
    o.value = withTiming(f.o, cfg)
  }, [f.w, f.m, f.o, w, m, o])
  const ws = useAnimatedStyle(() => ({ flex: w.value }))
  const ms = useAnimatedStyle(() => ({ flex: m.value }))
  const os = useAnimatedStyle(() => ({ flex: o.value }))
  return (
    <View style={s.bar}>
      <Animated.View style={[{ backgroundColor: WOMEN }, ws]} />
      <Animated.View style={[{ backgroundColor: MEN }, ms]} />
      <Animated.View style={[{ backgroundColor: OPEN }, os]} />
    </View>
  )
}

export function CrowdMixPicker({ womenPct, capacity, onChange, locked, lockNote, disabled }: Props) {
  const presetMatch = OPTIONS.find(p => p.value === womenPct)
  const [custom, setCustom] = useState(!presetMatch)
  const editable = !disabled && !locked
  const split = crowdSplit(capacity, womenPct)

  const pick = (v: number | null) => {
    if (!editable) return
    hSelection()
    setCustom(false)
    onChange(v)
  }

  const step = (delta: number) => {
    if (!editable) return
    hSelection()
    onChange(Math.min(90, Math.max(10, (womenPct ?? 50) + delta)))
  }

  return (
    <>
      <View style={[ef.fieldLabelRow, { marginTop: 24 }]}>
        <Text style={ef.fieldLabel}>Crowd mix</Text>
        {locked && lockNote ? <Text style={ef.fieldLockNote}>{lockNote}</Text> : null}
      </View>

      <View style={[s.card, locked && ef.sectionLocked]}>
        {/* Live preview of the room */}
        <LiveBar capacity={capacity} womenPct={womenPct} />
        <View style={s.legend}>
          {split ? (
            <>
              {split.women > 0 && <Legend color={WOMEN} text={`${split.women} women`} />}
              {split.men > 0 && <Legend color={MEN} text={`${split.men} men`} />}
              {split.open > 0 && <Legend color={OPEN} text={`${split.open} open to anyone`} />}
            </>
          ) : (
            <Legend color={OPEN} text={`All ${capacity} spots open to anyone`} />
          )}
        </View>

        {/* The choices */}
        <View style={s.grid}>
          {OPTIONS.map(p => {
            const active = !custom && p.value === womenPct
            return (
              <Pressable key={p.key} style={[s.option, active && s.optionActive]} onPress={() => pick(p.value)}>
                <View style={s.optionTop}>
                  <View style={[s.iconWrap, { backgroundColor: withOpacity(p.tint, 0.14) }]}>
                    <p.Icon size={16} color={p.tint} strokeWidth={2.2} />
                  </View>
                  {active && <View style={s.dot} />}
                </View>
                <Text style={[s.optionLabel, active && s.optionLabelActive]} numberOfLines={1}>{p.label}</Text>
                <Text style={s.optionSub} numberOfLines={1}>{p.sub}</Text>
                <MiniBar value={p.value} />
              </Pressable>
            )
          })}
        </View>

        <Pressable
          style={[s.customBtn, custom && s.optionActive]}
          onPress={() => {
            if (!editable) return
            hSelection()
            setCustom(true)
            if (womenPct == null || womenPct === 0 || womenPct === 100 || presetMatch) onChange(70)
          }}
        >
          <View style={[s.iconWrap, { backgroundColor: withOpacity(Colors.inkPrimary, 0.1) }]}>
            <SlidersHorizontal size={16} color={Colors.inkPrimary} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.optionLabel, custom && s.optionLabelActive]}>Custom</Text>
            <Text style={s.optionSub}>Set your own split, in steps of 10%</Text>
          </View>
          {custom && <View style={s.dot} />}
        </Pressable>

        {custom && womenPct != null && (
          <View style={s.customRow}>
            <Pressable style={[ef.stepperBtn, womenPct <= 10 && { opacity: 0.35 }]} onPress={() => step(-10)}>
              <Minus size={18} color={Colors.inkPrimary} />
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={s.customValue}>
                <Text style={{ color: WOMEN }}>{womenPct}%</Text> women · <Text style={{ color: MEN }}>{100 - womenPct}%</Text> men
              </Text>
              <Text style={s.optionSub}>Plus a few open spots for anyone</Text>
            </View>
            <Pressable style={[ef.stepperBtn, womenPct >= 90 && { opacity: 0.35 }]} onPress={() => step(10)}>
              <Plus size={18} color={Colors.inkPrimary} />
            </Pressable>
          </View>
        )}
      </View>
    </>
  )
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendText}>{text}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    marginTop: 10,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  bar: { flexDirection: 'row', height: 14, borderRadius: 999, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10, marginBottom: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    width: '48.5%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: Colors.elevated,
  },
  optionActive: { borderColor: Colors.inkPrimary, backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  optionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.inkPrimary },
  optionLabel: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, marginTop: 6 },
  optionLabelActive: { color: Colors.inkPrimary },
  optionSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  mini: { flexDirection: 'row', height: 4, borderRadius: 999, overflow: 'hidden', marginTop: 10, gap: 1.5 },

  customBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 8, padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: 'transparent',
    backgroundColor: Colors.elevated,
  },
  customRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 10, padding: 8, borderRadius: 16,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.05),
  },
  customValue: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
})
