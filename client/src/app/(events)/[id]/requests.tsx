import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AlertCircle, ArrowLeft, Inbox } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { BrandedLoader, EmptyState, BrandedRefreshControl, ConfirmSheet } from '@/components/ui'
import { JoinRequestRow } from '@/components/events/JoinRequestRow'
import { useJoinRequests } from '@/hooks/useJoinRequests'
import type { JoinRequest } from '@/api/apiService'

function QuotaBar({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total > 0 ? Math.min(1, used / total) : 0
  return (
    <View style={s.quota}>
      <View style={s.quotaHead}>
        <Text style={s.quotaLabel}>{label}</Text>
        <Text style={s.quotaCount}>{used}/{total}</Text>
      </View>
      <View style={s.quotaTrack}>
        <View style={[s.quotaFill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  )
}

export default function JoinRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { data, loading, refreshing, loadError, busy, accept, decline, acceptAllThatFit, reload } = useJoinRequests(id)
  const [declining, setDeclining] = useState<JoinRequest | null>(null)

  const onAccept = useCallback((r: JoinRequest) => accept(r.id, r.name), [accept])
  const onDecline = useCallback((r: JoinRequest) => setDeclining(r), [])

  const requests = data?.requests ?? []
  const fitCount = requests.filter(r => r.can_accept).length
  const going = data ? data.capacity - data.spots_left : 0
  const ratio = data?.ratio

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Join Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}><BrandedLoader /></View>
      ) : loadError || !data ? (
        <View style={s.center}>
          <EmptyState
            icon={<AlertCircle size={48} color={Colors.inkDisabled} strokeWidth={1.2} />}
            title="Couldn't load requests"
            subtitle="Check your connection and try again."
            ctaLabel="Retry"
            onCtaPress={reload}
          />
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<BrandedRefreshControl refreshing={refreshing} onRefresh={() => reload(true)} />}
        >
          <View style={s.summary}>
            <QuotaBar label="Going" used={going} total={data.capacity} />
            {ratio && ratio.women_pct > 0 && ratio.women_pct < 100 && (
              <View style={s.mixRow}>
                <Text style={s.mixText}>{data.counts.women} women · {data.counts.men} men · {data.counts.other} others</Text>
                <Text style={s.mixLeft}>
                  {ratio.women_left} more women · {ratio.men_left} more men can join
                </Text>
              </View>
            )}
          </View>

          {requests.length === 0 ? (
            <EmptyState
              icon={<Inbox size={48} color={Colors.inkDisabled} strokeWidth={1.2} />}
              title="No pending requests"
              subtitle="When someone asks to join, they'll show up here — and we'll ping you."
            />
          ) : (
            <>
              <Pressable style={s.bulkBtn} onPress={acceptAllThatFit} disabled={!!busy || fitCount === 0}>
                <LinearGradient
                  colors={fitCount > 0 ? [Colors.brandOrange, Colors.brandCoral] : [Colors.grayBorder, Colors.grayBorder]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.bulkGradient}
                >
                  {busy === 'bulk'
                    ? <ActivityIndicator color={Colors.inkPrimary} />
                    : <Text style={s.bulkText}>{fitCount > 0 ? `Accept all that fit (${fitCount})` : 'No spots left to accept'}</Text>}
                </LinearGradient>
              </Pressable>

              <Text style={s.sectionLabel}>Pending ({requests.length})</Text>
              {requests.map(r => (
                <JoinRequestRow
                  key={r.id}
                  request={r}
                  busy={busy === r.id}
                  disabled={!!busy}
                  onAccept={onAccept}
                  onDecline={onDecline}
                />
              ))}
              <Text style={s.footnote}>
                Declining is final — they can't request this event again. Pending requests expire when the event starts.
              </Text>
            </>
          )}
        </ScrollView>
      )}

      <ConfirmSheet
        visible={!!declining}
        title="Decline request?"
        body={`${declining?.name ?? 'They'} won't be able to request this event again.`}
        confirmLabel="Decline"
        destructive
        onConfirm={() => { if (declining) decline(declining.id) }}
        onClose={() => setDeclining(null)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  summary: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.divider,
    padding: 14, gap: 12, marginBottom: 16,
  },
  quota: { gap: 6 },
  quotaHead: { flexDirection: 'row', justifyContent: 'space-between' },
  quotaLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  quotaCount: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  quotaTrack: { height: 6, borderRadius: 3, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), overflow: 'hidden' },
  quotaFill: { height: 6, borderRadius: 3, backgroundColor: Colors.brandOrange },
  mixRow: { gap: 2 },
  mixText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  mixLeft: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },

  bulkBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 8 },
  bulkGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  bulkText: { color: Colors.inkPrimary, fontFamily: FontFamily.bodySemiBold, fontSize: 15 },
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 8,
  },
  footnote: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, marginTop: 8, lineHeight: 18 },
})
