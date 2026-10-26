import { useEffect, useState, type ReactNode } from 'react'
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'
import type { EventDetail } from '@/api/apiService'

const { height: H } = Dimensions.get('window')

export interface GateStep {
  label: string
  time: string
  /** Already happened (filled dot). */
  done?: boolean
  /** The one this page is about (highlighted). */
  current?: boolean
}

export interface GateAction {
  label: string
  onPress: () => void
  kind?: 'primary' | 'secondary'
}

interface Props {
  event: EventDetail
  /** Small caps line over the title, e.g. "CHECK-IN". */
  eyebrow: string
  title: string
  body: string
  icon: ReactNode
  /** Counts down to this moment, live, if given. */
  countdownTo?: Date | null
  countdownLabel?: string
  steps?: GateStep[]
  /** Extra card under the body (refund info, what you can still do). */
  extra?: ReactNode
  actions?: GateAction[]
  onBack: () => void
}

function remaining(to: Date, now: number): string {
  const ms = Math.max(0, to.getTime() - now)
  const m = Math.floor(ms / 60000)
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  const mm = m % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${mm}m`
  return `${mm}m`
}

/**
 * The page for anything you can't do right now on an event: the event's
 * poster across the top, what's going on and why in plain words, a live
 * countdown when there's something to wait for, the timeline, and a useful
 * next step instead of a dead end.
 */
export function EventGateView(p: Props) {
  const insets = useSafeAreaInsets()
  const cover = p.event.cover_photos?.[0]?.url
  const [now, setNow] = useState(() => Date.now())

  // Re-render once a minute so the countdown stays right. Stops at zero.
  useEffect(() => {
    if (!p.countdownTo) return
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [p.countdownTo])

  return (
    <View style={s.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <View style={[s.hero, { height: Math.round(H * 0.34) + insets.top }]}>
          {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : null}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0.45)', withOpacity(Colors.background, 0.3), Colors.background]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.eventChip}>
            <Text style={s.eventChipText} numberOfLines={1}>{p.event.title}</Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(360)} style={s.body}>
          <View style={s.icon}>{p.icon}</View>
          <Text style={s.eyebrow}>{p.eyebrow}</Text>
          <Text style={s.title}>{p.title}</Text>
          <Text style={s.text}>{p.body}</Text>

          {p.countdownTo && p.countdownTo.getTime() > now ? (
            <View style={s.countdown}>
              <Text style={s.countdownLabel}>{p.countdownLabel ?? 'Opens in'}</Text>
              <Text style={s.countdownValue}>{remaining(p.countdownTo, now)}</Text>
            </View>
          ) : null}

          {p.steps?.length ? (
            <View style={s.steps}>
              {p.steps.map((st, i) => (
                <View key={st.label} style={s.step}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={[s.dot, st.done && s.dotDone, st.current && s.dotCurrent]} />
                    {i < p.steps!.length - 1 ? <View style={s.line} /> : null}
                  </View>
                  <View style={s.stepText}>
                    <Text style={[s.stepLabel, st.current && s.stepLabelCurrent]}>{st.label}</Text>
                    <Text style={s.stepTime}>{st.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {p.extra}

          {p.actions?.length ? (
            <View style={s.actions}>
              {p.actions.map(a => (
                <Pressable key={a.label} style={[s.btn, a.kind === 'secondary' ? s.btnGrey : s.btnPrimary]} onPress={() => { hTap(); a.onPress() }}>
                  <Text style={a.kind === 'secondary' ? s.btnGreyText : s.btnPrimaryText}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <Pressable style={[s.back, { top: insets.top + 8 }]} onPress={() => { hTap(); p.onBack() }} hitSlop={8}>
        <ArrowLeft size={20} color={Colors.white} strokeWidth={2.2} />
      </Pressable>
    </View>
  )
}

/** "Sat 2 Nov, 6:00 pm" */
export function gateTime(d: Date | null): string {
  if (!d) return ''
  return d.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: { overflow: 'hidden', backgroundColor: Colors.surface, justifyContent: 'flex-end' },
  eventChip: { alignSelf: 'center', maxWidth: '80%', marginBottom: 18, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.45)' },
  eventChipText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.white },
  back: { position: 'absolute', left: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  body: { paddingHorizontal: 24, marginTop: -30, alignItems: 'center' },
  icon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, marginBottom: 14 },
  eyebrow: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.6, color: Colors.inkDisabled },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.8, color: Colors.inkPrimary, textAlign: 'center', marginTop: 4 },
  text: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 22, color: Colors.inkSecondary, textAlign: 'center', marginTop: 10 },

  countdown: { alignSelf: 'stretch', alignItems: 'center', marginTop: 20, paddingVertical: 16, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  countdownLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.inkDisabled },
  countdownValue: { fontFamily: FontFamily.displayExtraBold, fontSize: 40, letterSpacing: -1, color: Colors.inkPrimary, marginTop: 2 },

  steps: { alignSelf: 'stretch', marginTop: 16, padding: 18, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  step: { flexDirection: 'row', gap: 14 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: withOpacity(Colors.inkPrimary, 0.3), marginTop: 3 },
  dotDone: { backgroundColor: withOpacity(Colors.inkPrimary, 0.3), borderColor: 'transparent' },
  dotCurrent: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: withOpacity(Colors.inkPrimary, 0.12), marginVertical: 3 },
  stepText: { flex: 1, paddingBottom: 14 },
  stepLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkSecondary },
  stepLabelCurrent: { color: Colors.inkPrimary },
  stepTime: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkDisabled, marginTop: 1 },

  actions: { alignSelf: 'stretch', gap: 10, marginTop: 22 },
  btn: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: Colors.inkPrimary },
  btnPrimaryText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.background },
  btnGrey: { backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  btnGreyText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
})
