import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AlertCircle, ArrowLeft } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { BrandedLoader, EmptyState } from '@/components/ui'
import ApiService, { type EventDetail } from '@/api/apiService'
import { ManageWaitlistView } from '@/components/events/ManageWaitlistView'
import { useManageWaitlist } from '@/hooks/useManageWaitlist'

export default function ManageWaitlistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { loading, refreshing, loadError, admitting, pending, offered, pendingByGender, handleAdmit, reload } = useManageWaitlist(id)
  const [event, setEvent] = useState<EventDetail | null>(null)

  useEffect(() => { if (id) ApiService.getEvent(id).then(setEvent).catch(() => {}) }, [id])

  if (!loading && !loadError) {
    return (
      <View style={s.root}>
        <ManageWaitlistView
          event={event}
          pending={pending}
          offered={offered}
          byGender={pendingByGender}
          admitting={admitting}
          onAdmit={handleAdmit}
          refreshing={refreshing}
          onRefresh={() => reload(true)}
          onBack={() => router.back()}
          onOpenProfile={e => router.push(`/(profile)/${e.id}` as any)}
        />
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Manage Waitlist</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <BrandedLoader />
        </View>
      ) : loadError ? (
        <View style={s.center}>
          <EmptyState
            icon={<AlertCircle size={48} color={Colors.inkDisabled} strokeWidth={1.2} />}
            title="Couldn't load waitlist"
            subtitle="Check your connection and try again."
            ctaLabel="Retry"
            onCtaPress={reload}
          />
        </View>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },

  admitBtn: { marginHorizontal: 20, marginTop: 16, marginBottom: 8, borderRadius: 14, overflow: 'hidden' },
  admitGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  admitText: { color: Colors.inkPrimary, fontFamily: FontFamily.bodySemiBold, fontSize: 15 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },

  sectionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.inkDisabled,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
})
