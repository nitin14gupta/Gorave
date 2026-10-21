import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { ActivityIndicator, Dimensions, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { CameraView } from 'expo-camera'
import Svg, { Path } from 'react-native-svg'
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Check, ChevronDown, Flashlight, FlashlightOff, ListChecks, QrCode, Search, X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton, BrandedRefreshControl } from '@/components/ui'
import { hTap } from '@/lib/haptics'
import type { EventAttendee } from '@/api/apiService'

export type ScanResult = {
  ok: boolean
  already_checked_in?: boolean
  name: string
  username?: string | null
  error?: string
}

export interface ScannerViewProps {
  eventTitle: string
  granted: boolean
  /** Camera is off and the OS won't ask again: send them to Settings. */
  blocked: boolean
  onRequestPermission: () => void
  onOpenSettings: () => void
  onBarcodeScanned: (e: { data: string }) => void
  scanning: boolean
  /** The latest scan, cleared after a couple of seconds. */
  result: ScanResult | null
  /** The guest that scan matched, for their photo. */
  resultGuest: EventAttendee | null
  attendees: EventAttendee[]
  loading: boolean
  query: string
  onQuery: (q: string) => void
  checkingIn: string | null
  onCheckin: (a: EventAttendee) => void
  refreshing: boolean
  onRefresh: () => void
  checkedIn: number
  onBack: () => void
}

const { width: W, height: H } = Dimensions.get('window')
const FRAME = Math.round(W * 0.68)
const FRAME_TOP = Math.round((H - FRAME) / 2 - 40)
// Matches the corner marks' outer curve.
const FRAME_R = 20

/** An SVG path for a rounded rectangle, used to cut the scan window. */
function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
}

/**
 * The door scanner. The camera fills the screen with a framed square to aim
 * at, like a venue's door app. A scan lands as a big card with the guest's
 * photo, a clear yes or no. The guest list slides up for checking someone
 * in by hand, and the torch is one tap away for dark doorways.
 */
export function ScannerView(p: ScannerViewProps) {
  const insets = useSafeAreaInsets()
  const [listOpen, setListOpen] = useState(false)
  const [torch, setTorch] = useState(false)
  // The torch goes off whenever you leave the screen, so it never stays on.
  useFocusEffect(useCallback(() => () => setTorch(false), []))
  const total = p.attendees.length

  return (
    <View style={s.root}>
      {p.granted ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" enableTorch={torch && !listOpen} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={listOpen ? undefined : p.onBarcodeScanned} />
      ) : (
        <View style={[StyleSheet.absoluteFill, s.noCam]}>
          <QrCode size={44} color={Colors.inkDisabled} strokeWidth={1.4} />
          <Text style={s.noCamText}>{p.blocked ? 'Camera access is off. Turn it on in Settings to scan tickets.' : 'Allow the camera to scan tickets at the door.'}</Text>
          <View style={{ width: 220 }}>
            <PrimaryButton label={p.blocked ? 'Open Settings' : 'Allow camera'} onPress={p.blocked ? p.onOpenSettings : p.onRequestPermission} />
          </View>
        </View>
      )}

      {p.granted ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {/* One shade with a rounded hole cut out (even-odd fill), so the
              clear window has the same curve as the corner marks. */}
          <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
            <Path
              fillRule="evenodd"
              fill={SHADE}
              d={`M0 0H${W}V${H}H0Z ${roundedRect((W - FRAME) / 2, FRAME_TOP, FRAME, FRAME, FRAME_R)}`}
            />
          </Svg>
          <View style={[s.frame, { position: 'absolute', left: (W - FRAME) / 2, top: FRAME_TOP }]}>
            <View style={[s.corner, s.tl]} /><View style={[s.corner, s.tr]} />
            <View style={[s.corner, s.bl]} /><View style={[s.corner, s.br]} />
            {p.scanning ? <ActivityIndicator color={Colors.white} /> : null}
          </View>
          <Text style={[s.aim, { position: 'absolute', left: 0, right: 0, top: FRAME_TOP + FRAME + 18, textAlign: 'center' }]}>Point at the ticket QR</Text>
        </View>
      ) : null}

      <View style={[s.top, { paddingTop: insets.top + 8 }]}>
        <Pressable style={s.glassBtn} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.white} strokeWidth={2} />
        </Pressable>
        <View style={s.counter}>
          <Text style={s.counterBig}>{p.checkedIn}</Text>
          <Text style={s.counterOf}>/ {total} in</Text>
        </View>
        {p.granted ? (
          <Pressable style={[s.glassBtn, torch && s.torchOn]} onPress={() => { hTap(); setTorch(t => !t) }} hitSlop={8}>
            {torch ? <Flashlight size={19} color={Colors.nearBlack} strokeWidth={2.2} /> : <FlashlightOff size={19} color={Colors.white} strokeWidth={2.2} />}
          </Pressable>
        ) : <View style={{ width: 40 }} />}
      </View>

      {p.result ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(200)} style={[s.result, { bottom: insets.bottom + 96 }]}>
          <ResultCard p={p} />
        </Animated.View>
      ) : null}

      <View style={[s.bottom, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable style={s.listBtn} onPress={() => { hTap(); setListOpen(true) }}>
          <ListChecks size={18} color={Colors.nearBlack} strokeWidth={2.2} />
          <Text style={s.listBtnText}>Guest list · check in by hand</Text>
        </Pressable>
      </View>

      {listOpen ? (
        <Animated.View entering={SlideInDown.duration(260)} exiting={SlideOutDown.duration(220)} style={[s.sheet, { paddingTop: insets.top + 8 }]}>
          <View style={s.sheetHead}>
            <Text style={s.sheetTitle}>Guest list</Text>
            <Pressable style={s.sheetClose} onPress={() => setListOpen(false)} hitSlop={8}>
              <ChevronDown size={20} color={Colors.inkPrimary} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={s.search}>
            <Search size={16} color={Colors.inkDisabled} strokeWidth={2} />
            <TextInput style={s.searchInput} value={p.query} onChangeText={p.onQuery} placeholder="Search by name" placeholderTextColor={Colors.inkDisabled} />
          </View>
          {p.loading ? <ActivityIndicator style={{ marginTop: 30 }} color={Colors.inkSecondary} /> : (
            <FlatList
              data={p.attendees}
              keyExtractor={a => a.id}
              keyboardShouldPersistTaps="handled"
              refreshControl={<BrandedRefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} />}
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              renderItem={({ item }) => <ListRow a={item} busy={p.checkingIn === item.id} onCheckin={() => p.onCheckin(item)} />}
              ListFooterComponent={<Text style={s.note}>Checking someone in by hand is logged, so only do it when their ticket won&apos;t scan.</Text>}
            />
          )}
        </Animated.View>
      ) : null}
    </View>
  )
}

function ResultCard({ p }: { p: ScannerViewProps }) {
  const r = p.result!
  const ok = r.ok && !r.already_checked_in
  const g = p.resultGuest
  return (
    <View style={[s.card, ok ? s.cardOk : r.already_checked_in ? s.cardWarn : s.cardBad]}>
      {g?.avatar && r.ok ? (
        <Image source={{ uri: g.avatar }} style={s.cardPhoto} contentFit="cover" />
      ) : (
        <View style={[s.cardPhoto, s.cardIcon]}>
          {r.ok ? <Check size={30} color={Colors.white} strokeWidth={3} /> : <X size={30} color={Colors.white} strokeWidth={3} />}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.cardKicker}>{ok ? 'LET THEM IN' : r.already_checked_in ? 'ALREADY IN' : 'NOT VALID'}</Text>
        <Text style={s.cardName} numberOfLines={1}>{r.ok ? r.name : 'Not a ticket for this event'}</Text>
        <Text style={s.cardSub} numberOfLines={2}>{ok ? (r.username ? `@${r.username}` : 'Checked in') : r.already_checked_in ? 'This ticket was scanned before' : (r.error ?? 'Ask them to open their ticket in Gorave')}</Text>
      </View>
    </View>
  )
}

function ListRow({ a, busy, onCheckin }: { a: EventAttendee; busy: boolean; onCheckin: () => void }) {
  const isIn = !!a.checked_in_at
  return (
    <View style={s.row}>
      <View style={s.avatar}>{a.avatar ? <Image source={{ uri: a.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Text style={s.initial}>{(a.name ?? '?').charAt(0)}</Text>}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>{a.name ?? 'Guest'}</Text>
        <Text style={s.sub} numberOfLines={1}>{a.username ? `@${a.username}` : ''}</Text>
      </View>
      {isIn ? (
        <View style={s.inPill}><Check size={12} color={Colors.background} strokeWidth={3} /><Text style={s.inText}>In</Text></View>
      ) : (
        <Pressable style={s.checkBtn} onPress={() => { hTap(); onCheckin() }} disabled={busy}>
          {busy ? <ActivityIndicator size="small" color={Colors.inkPrimary} /> : <Text style={s.checkText}>Check in</Text>}
        </Pressable>
      )}
    </View>
  )
}

const SHADE = 'rgba(0,0,0,0.55)'
const OK = '#1F8F5A'
const BAD = '#C0392B'
const WARN = '#8A6D1D'

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.nearBlack },
  noCam: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, backgroundColor: Colors.background },
  noCamText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center' },

  frame: { width: FRAME, height: FRAME, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: Colors.white },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: FRAME_R },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: FRAME_R },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: FRAME_R },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: FRAME_R },
  aim: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: withOpacity(Colors.white, 0.85) },

  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  torchOn: { backgroundColor: Colors.white },
  glassBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  counter: { flexDirection: 'row', alignItems: 'baseline', gap: 4, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.45)' },
  counterBig: { fontFamily: FontFamily.displayExtraBold, fontSize: 22, color: Colors.white },
  counterOf: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: withOpacity(Colors.white, 0.75) },

  result: { position: 'absolute', left: 16, right: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 22 },
  cardOk: { backgroundColor: OK },
  cardBad: { backgroundColor: BAD },
  cardWarn: { backgroundColor: WARN },
  cardPhoto: { width: 64, height: 80, borderRadius: 14 },
  cardIcon: { backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  cardKicker: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.6, color: withOpacity(Colors.white, 0.85) },
  cardName: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, letterSpacing: -0.4, color: Colors.white, marginTop: 2 },
  cardSub: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: withOpacity(Colors.white, 0.85), marginTop: 2 },

  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  listBtn: { height: 54, borderRadius: 999, backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  listBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.nearBlack },

  sheet: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Colors.background },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  sheetTitle: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, letterSpacing: -0.6, color: Colors.inkPrimary },
  sheetClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, height: 44, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  searchInput: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  inPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.inkPrimary },
  inText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.background },
  checkBtn: { minWidth: 84, alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Colors.divider },
  checkText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  note: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, paddingHorizontal: 20, paddingTop: 14 },
})
