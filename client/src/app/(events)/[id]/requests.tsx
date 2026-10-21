import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AlertCircle, ArrowLeft } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { BrandedLoader, EmptyState, ConfirmSheet } from '@/components/ui'
import { useJoinRequests } from '@/hooks/useJoinRequests'
import ApiService, { type EventDetail, type JoinRequest } from '@/api/apiService'
import { JoinRequestsView } from '@/components/events/JoinRequestsView'

export default function JoinRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { data, loading, refreshing, loadError, busy, accept, decline, acceptAllThatFit, reload } = useJoinRequests(id)
  const [declining, setDeclining] = useState<JoinRequest | null>(null)
  const [event, setEvent] = useState<EventDetail | null>(null)

  useEffect(() => { if (id) ApiService.getEvent(id).then(setEvent).catch(() => {}) }, [id])

  const onAccept = useCallback((r: JoinRequest) => accept(r.id, r.name), [accept])
  const onDecline = useCallback((r: JoinRequest) => setDeclining(r), [])

  const declineSheet = (
    <ConfirmSheet
      visible={!!declining}
      title="Decline this request?"
      body={`${declining?.name ?? 'They'} won't be able to ask to join this event again.`}
      confirmLabel="Decline"
      destructive
      onConfirm={() => { if (declining) decline(declining.id) }}
      onClose={() => setDeclining(null)}
    />
  )

  if (!loading && !loadError && data) {
    return (
      <View style={s.root}>
        <JoinRequestsView
          event={event}
          data={data}
          busy={busy}
          onAccept={onAccept}
          onDecline={onDecline}
          onAcceptAll={acceptAllThatFit}
          onOpenProfile={r => router.push(`/(profile)/${r.id}` as any)}
          refreshing={refreshing}
          onRefresh={() => reload(true)}
          onBack={() => router.back()}
        />
        {declineSheet}
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Requests</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? (
        <View style={s.center}><BrandedLoader /></View>
      ) : (
        <View style={s.center}>
          <EmptyState
            icon={<AlertCircle size={48} color={Colors.inkDisabled} strokeWidth={1.2} />}
            title="Couldn't load requests"
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
})
