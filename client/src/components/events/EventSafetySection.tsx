import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { ChevronRight, Phone, Share2, ShieldCheck, Siren } from 'lucide-react-native'
import { useSosFlow } from './SosButton'
import { ShareEventDetailsSheet } from './ShareEventDetailsSheet'
import { formatDateTime } from './eventDetailUtils'
import { buildEventShareUrl } from '@/lib/deepLink'
import { isEventActive, isEventPast } from '@/lib/dates'
import { hTap } from '@/lib/haptics'
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts'
import { Colors, FontFamily, withOpacity } from '@/constants'
import type { EmergencyContact, EventDetail } from '@/api/apiService'

const MAX_SHEET_HEIGHT = Dimensions.get('window').height * 0.8

/** "Riya gets your SOS" / "Riya and 2 more get your SOS". */
function contactsLine(contacts: EmergencyContact[]): string {
  if (contacts.length === 0) return 'No emergency contact yet'
  const first = contacts[0].name.split(' ')[0]
  return contacts.length === 1 ? `${first} gets your SOS` : `${first} and ${contacts.length - 1} more get your SOS`
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

// ── Lab B: the toolkit sheet ─────────────────────────────────────────────────

function ToolkitSheet({ live, contacts, onShare, onSos, onContacts, onClose }: {
  live: boolean
  contacts: EmergencyContact[]
  onShare: () => void
  onSos: () => void
  onContacts: () => void
  onClose: () => void
}) {
  const ref = useRef<BottomSheetModal>(null)
  useEffect(() => { ref.current?.present() }, [])
  // Close first, then open the next sheet, so two sheets never fight.
  const go = (fn: () => void) => { hTap(); ref.current?.dismiss(); setTimeout(fn, 250) }
  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      maxDynamicContentSize={MAX_SHEET_HEIGHT}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={t.bg}
      handleIndicatorStyle={t.handle}
    >
      <BottomSheetView style={t.content}>
        <Text style={t.title}>Safety toolkit</Text>
        <View style={t.card}>
          <Pressable style={t.row} onPress={() => go(onShare)}>
            <View style={t.icon}><Share2 size={18} color={Colors.inkPrimary} strokeWidth={2} /></View>
            <View style={{ flex: 1 }}>
              <Text style={t.label}>Share your plans</Text>
              <Text style={t.sub}>Send where and when to someone you trust</Text>
            </View>
            <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={2} />
          </Pressable>
          <Pressable style={[t.row, t.border]} onPress={() => go(onSos)}>
            <View style={[t.icon, t.sosIcon]}><Siren size={18} color={Colors.destructive} strokeWidth={2.2} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[t.label, { color: Colors.destructive }]}>SOS</Text>
              <Text style={t.sub}>{live ? 'Tap if you need help now' : 'Alerts your contacts with your location'}</Text>
            </View>
            <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={2} />
          </Pressable>
          <Pressable style={[t.row, t.border]} onPress={() => go(onContacts)}>
            <View style={t.icon}><Phone size={18} color={Colors.inkPrimary} strokeWidth={2} /></View>
            <View style={{ flex: 1 }}>
              <Text style={t.label}>Emergency contacts</Text>
              <Text style={t.sub}>{contactsLine(contacts)}</Text>
            </View>
            <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={2} />
          </Pressable>
        </View>
        <View style={{ height: 28 }} />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

// ── Section ──────────────────────────────────────────────────────────────────

/**
 * Your safety on the event page: one "Safety toolkit" row, Uber-style, that
 * opens a sheet with the tools (share your plans, SOS, emergency contacts).
 * Nothing to read. While the night is live a red SOS sits right on the row,
 * and the only extra line is a nudge when nobody would get your SOS.
 */
export function EventSafetySection({ event }: { event: EventDetail }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [toolkitOpen, setToolkitOpen] = useState(false)
  const { contacts, load } = useEmergencyContacts()
  const sos = useSosFlow(event.id)
  useFocusEffect(useCallback(() => { load() }, [load]))

  if (isEventPast(event)) return null

  const live = isEventActive(event)
  const noContacts = contacts.length === 0
  const openContacts = () => router.push('/(safety)/contacts' as any)
  const share = () => setShareOpen(true)

  const sheets = (
    <>
      <ShareEventDetailsSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        title={event.title}
        dateTimeLabel={formatDateTime(event.date_time)}
        locationName={event.location_name}
        hostName={event.host_name}
        shareUrl={buildEventShareUrl(event.id)}
      />
      {sos.sheets}
    </>
  )

  const nudge = noContacts ? (
    <Pressable style={s.nudge} onPress={() => { hTap(); openContacts() }} hitSlop={6}>
      <Text style={s.nudgeText}>Add an emergency contact so your SOS reaches someone</Text>
      <ChevronRight size={14} color={Colors.inkSecondary} strokeWidth={2.2} />
    </Pressable>
  ) : null

  return (
      <View style={s.wrap}>
        <Pressable style={b.row} onPress={() => { hTap(); setToolkitOpen(true) }}>
          <View style={b.icon}><ShieldCheck size={19} color={Colors.inkPrimary} strokeWidth={2} /></View>
          <View style={{ flex: 1 }}>
            <Text style={b.label}>Safety toolkit</Text>
            <Text style={b.sub} numberOfLines={1}>Share your plans, SOS, emergency contacts</Text>
          </View>
          {live ? (
            // During the night, one tap to SOS without opening anything.
            <Pressable style={b.sos} onPress={() => { hTap(); sos.open() }} hitSlop={6}>
              <Siren size={14} color={Colors.white} strokeWidth={2.4} />
              <Text style={b.sosText}>SOS</Text>
            </Pressable>
          ) : <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={2} />}
        </Pressable>
        {nudge}
        {toolkitOpen ? (
          <ToolkitSheet
            live={live}
            contacts={contacts}
            onShare={share}
            onSos={sos.open}
            onContacts={openContacts}
            onClose={() => setToolkitOpen(false)}
          />
        ) : null}
        {sheets}
      </View>
  )
}

const s = StyleSheet.create({
  wrap: { marginTop: 4, marginBottom: 20 },
  nudge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, paddingHorizontal: 2 },
  nudgeText: { flexShrink: 1, fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
})

const b = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider,
  },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 15.5, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkSecondary, marginTop: 1 },
  sos: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: Colors.destructive },
  sosText: { fontFamily: FontFamily.headingBold, fontSize: 13, letterSpacing: 0.4, color: Colors.white },
})

const t = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated, borderRadius: 28 },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  title: {
    fontFamily: FontFamily.displayExtraBold, fontSize: 26, letterSpacing: -0.6,
    color: Colors.inkPrimary, paddingHorizontal: 4, paddingTop: 4, paddingBottom: 14,
  },
  card: { borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.04), borderWidth: 1, borderColor: Colors.divider, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  border: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
  sosIcon: { backgroundColor: withOpacity(Colors.destructive, 0.1) },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 15.5, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkSecondary, marginTop: 1 },
})
