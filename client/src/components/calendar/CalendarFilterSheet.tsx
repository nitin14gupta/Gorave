import { useRef, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Check, ChevronRight, MapPin, PartyPopper, Ticket, Clock3, X } from 'lucide-react-native'
import { hTap, hSelection, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { CITY_PHOTOS } from '@/constants/cityPhotos'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { CityPickerSheet } from '@/components/ui/CityPickerSheet'
import { DEFAULT_CALENDAR_FILTERS, type CalendarFilters } from '@/hooks/useCalendarEvents'

const MAX_SHEET_HEIGHT = Dimensions.get('window').height * 0.85

interface Props {
  visible: boolean
  filters: CalendarFilters
  onApply: (f: CalendarFilters) => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

type ShowKey = 'showHosted' | 'showGoing' | 'showWaitlisted'
const SHOW_ROWS: { key: ShowKey; Icon: any; label: string; sub: string }[] = [
  { key: 'showHosted', Icon: PartyPopper, label: 'Hosting', sub: 'Nights you are throwing' },
  { key: 'showGoing', Icon: Ticket, label: 'Going', sub: 'Nights you have a spot at' },
  { key: 'showWaitlisted', Icon: Clock3, label: 'Waitlisted', sub: 'Waiting for a spot to open' },
]

/**
 * Calendar filters, in the same shape as the app's other sheets: a big title,
 * rows grouped in one card with a tick on the right, the city picker with
 * photo postcards, and Reset next to Apply at the bottom.
 */
function CalendarFilterSheetCore({ filters, onApply, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [draft, setDraft] = useState<CalendarFilters>(filters)
  const [cityOpen, setCityOpen] = useState(false)

  useEffect(() => { sheetRef.current?.present() }, [])

  const isDefault =
    draft.showHosted === DEFAULT_CALENDAR_FILTERS.showHosted &&
    draft.showGoing === DEFAULT_CALENDAR_FILTERS.showGoing &&
    draft.showWaitlisted === DEFAULT_CALENDAR_FILTERS.showWaitlisted &&
    !draft.city
  const nothingShown = !draft.showHosted && !draft.showGoing && !draft.showWaitlisted

  const toggle = (key: ShowKey) => { hSelection(); setDraft(d => ({ ...d, [key]: !d[key] })) }
  const reset = () => { hTap(); setDraft(DEFAULT_CALENDAR_FILTERS) }
  const apply = () => {
    hSuccess()
    onApply(draft)
    sheetRef.current?.dismiss()
  }

  const cityPhoto = draft.city ? CITY_PHOTOS[draft.city.name] : undefined

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        maxDynamicContentSize={MAX_SHEET_HEIGHT}
        enablePanDownToClose
        onDismiss={onClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={s.bg}
        handleIndicatorStyle={s.handle}
      >
        <BottomSheetView style={s.content}>
          <Text style={s.title}>Filters</Text>

          <Text style={s.label}>SHOW</Text>
          <View style={s.card}>
            {SHOW_ROWS.map(({ key, Icon, label, sub }, i) => {
              const on = draft[key]
              return (
                <Pressable
                  key={key}
                  style={[s.row, i > 0 && s.rowBorder]}
                  android_ripple={{ color: withOpacity(Colors.inkPrimary, 0.06) }}
                  onPress={() => toggle(key)}
                >
                  <View style={s.iconBox}>
                    <Icon size={18} color={on ? Colors.inkPrimary : Colors.inkDisabled} strokeWidth={1.8} />
                  </View>
                  <View style={s.rowText}>
                    <Text style={[s.rowLabel, !on && s.rowLabelOff]}>{label}</Text>
                    <Text style={s.rowSub}>{sub}</Text>
                  </View>
                  <View style={[s.tick, on && s.tickOn]}>
                    {on ? <Check size={13} color={Colors.background} strokeWidth={3} /> : null}
                  </View>
                </Pressable>
              )
            })}
          </View>

          <Text style={[s.label, s.labelGap]}>CITY</Text>
          <View style={s.card}>
            <Pressable
              style={s.row}
              android_ripple={{ color: withOpacity(Colors.inkPrimary, 0.06) }}
              onPress={() => { hTap(); setCityOpen(true) }}
            >
              <View style={s.iconBox}>
                {cityPhoto
                  ? <Image source={cityPhoto} style={StyleSheet.absoluteFill} contentFit="cover" />
                  : <MapPin size={18} color={Colors.inkPrimary} strokeWidth={1.8} />}
              </View>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>{draft.city ? draft.city.name : 'All cities'}</Text>
                <Text style={s.rowSub}>{draft.city ? draft.city.state : 'Wherever your nights are'}</Text>
              </View>
              {draft.city ? (
                <Pressable hitSlop={10} onPress={() => { hTap(); setDraft(d => ({ ...d, city: null })) }} style={s.clear}>
                  <X size={14} color={Colors.inkSecondary} strokeWidth={2.4} />
                </Pressable>
              ) : (
                <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={2} />
              )}
            </Pressable>
          </View>

          {nothingShown ? <Text style={s.warn}>Pick at least one to see anything on your calendar.</Text> : null}

          <View style={s.footer}>
            <Pressable onPress={reset} disabled={isDefault} hitSlop={8} style={s.resetBtn}>
              <Text style={[s.resetText, isDefault && s.resetTextOff]}>Reset</Text>
            </Pressable>
            <PrimaryButton label="Show results" onPress={apply} disabled={nothingShown} style={s.applyBtn} />
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      <CityPickerSheet
        visible={cityOpen}
        title="Which city?"
        selected={draft.city?.name ?? null}
        onSelect={city => setDraft(d => ({ ...d, city }))}
        onClose={() => setCityOpen(false)}
      />
    </>
  )
}

export function CalendarFilterSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <CalendarFilterSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated, borderRadius: 28 },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 28 },
  title: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 26,
    letterSpacing: -0.6,
    color: Colors.inkPrimary,
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled, paddingHorizontal: 4, marginBottom: 8 },
  labelGap: { marginTop: 22 },
  card: { borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.04), borderWidth: 1, borderColor: Colors.divider, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  iconBox: {
    width: 38, height: 38, borderRadius: 12, overflow: 'hidden',
    backgroundColor: withOpacity(Colors.inkPrimary, 0.06),
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 15.5, color: Colors.inkPrimary },
  rowLabelOff: { color: Colors.inkSecondary },
  rowSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkDisabled },
  tick: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: withOpacity(Colors.inkPrimary, 0.25), alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  clear: { width: 26, height: 26, borderRadius: 13, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center' },
  warn: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkSecondary, paddingHorizontal: 4, marginTop: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 24 },
  resetBtn: { paddingHorizontal: 8, paddingVertical: 12 },
  resetText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  resetTextOff: { color: Colors.inkDisabled },
  applyBtn: { flex: 1 },
})
