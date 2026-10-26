import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AlertCircle, ArrowLeft } from 'lucide-react-native'
import { Colors, FontFamily, Spacing, Radius, withOpacity } from '@/constants'
import { BrandedLoader, EmptyState } from '@/components/ui'
import { GuestListView } from '@/components/events/GuestListView'
import { useAttendees } from '@/hooks/useAttendees'
import { parseServerDate } from '@/lib/dates'
import { usePillStore } from '@/store/pillStore'

export default function AttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const showPill = usePillStore(s => s.show)

  const { loading, refreshing, loadError, going, checkedIn, notArrived, waitlist, scannerStatus, reload, genderCounts, event } = useAttendees(id)

  const handleScannerPress = () => {
    if (scannerStatus === 'ended') {
      showPill('The event has ended, so the scanner is closed', 'default')
    } else if (scannerStatus === 'not_yet') {
      const start = parseServerDate(event?.date_time)
      const opens = start ? new Date(start.getTime() - 3 * 3600_000) : null
      showPill(opens
        ? `The scanner opens at ${opens.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}, 3 hours before the event`
        : 'The scanner opens 3 hours before the event', 'default')
    } else {
      router.push(`/(events)/${id}/scanner` as any)
    }
  }

  if (!loading && !loadError) {
    return (
      <View style={s.root}>
        <GuestListView
          event={event}
          going={going}
          checkedIn={checkedIn}
          notArrived={notArrived}
          waitlist={waitlist}
          genderCounts={genderCounts}
          scannerStatus={scannerStatus}
          refreshing={refreshing}
          onRefresh={() => reload(true)}
          onScanner={handleScannerPress}
          onBack={() => router.back()}
        />
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
        </Pressable>
        <Text style={s.headerTitle}>Guest list</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <View style={s.center}><BrandedLoader /></View>
      ) : (
        <View style={s.center}>
          <EmptyState
            icon={<AlertCircle size={44} color={Colors.inkDisabled} strokeWidth={1.2} />}
            title="Couldn't load the guest list"
            subtitle="Check your connection and try again."
            ctaLabel="Retry"
            onCtaPress={reload}
          />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
})
