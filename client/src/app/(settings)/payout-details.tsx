import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { ArrowLeft, Landmark, Lock } from 'lucide-react-native'
import { HeaderIconBtn, PrimaryButton } from '@/components/ui'
import { LargeTitle, LargeTitleBar, useLargeTitle } from '@/components/ui/LargeTitle'
import { TicketPaper } from '@/components/events/TicketView'
import ApiService, { type PayoutDetailsResponse } from '@/api/apiService'
import { Colors, FontFamily, withOpacity } from '@/constants'

/**
 * Where your ticket earnings go, shown as a card in the same maroon as the
 * ticket and the QR pass, with only the masked details on it.
 */
export default function PayoutDetailsScreen() {
  const { scrollY, barHeight } = useLargeTitle()
  const [details, setDetails] = useState<PayoutDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    ApiService.getPayoutDetails()
      .then(setDetails)
      .catch((e: any) => setError(e?.message || 'Could not load payout details'))
      .finally(() => setLoading(false))
  }, [])

  useFocusEffect(load)

  const isUpi = details?.payout_method === 'upi'
  const bank = details?.bank_masked

  return (
    <View style={s.root}>
      <LargeTitleBar
        title="Payout details"
        scrollY={scrollY}
        pinned={loading || !!error || !details?.payout_method}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      {loading ? (
        <View style={[s.center, { paddingTop: barHeight }]}><ActivityIndicator color={Colors.inkSecondary} /></View>
      ) : error ? (
        <View style={[s.center, { paddingTop: barHeight }]}>
          <Landmark size={44} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>Couldn&apos;t load payout details</Text>
          <Text style={s.emptySub}>{error}</Text>
          <PrimaryButton label="Retry" size="small" style={s.emptyCta} onPress={load} />
        </View>
      ) : !details?.payout_method ? (
        <View style={[s.center, { paddingTop: barHeight }]}>
          <Landmark size={44} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No payout details yet</Text>
          <Text style={s.emptySub}>Add your bank or UPI so we know where to send your ticket earnings.</Text>
          <PrimaryButton label="Add payout details" size="small" style={s.emptyCta} onPress={() => router.push('/(host-onboarding)' as any)} />
        </View>
      ) : (
        <View style={[s.content, { paddingTop: barHeight }]}>
          <LargeTitle title="Payout details" scrollY={scrollY} style={s.bigTitle} />
          <View style={s.card}>
            <TicketPaper />
            <View style={s.cardTop}>
              <Text style={s.cardKind}>{isUpi ? 'UPI' : 'BANK ACCOUNT'}</Text>
              <Landmark size={20} color={withOpacity(Colors.white, 0.7)} strokeWidth={1.6} />
            </View>
            <Text style={s.cardMain} numberOfLines={1}>
              {isUpi ? details.upi_id_masked : bank?.account_number_masked}
            </Text>
            {!isUpi && bank ? (
              <View style={s.cardBottom}>
                <View>
                  <Text style={s.cardLabel}>HOLDER</Text>
                  <Text style={s.cardValue} numberOfLines={1}>{bank.account_holder_name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.cardLabel}>{bank.bank_name}</Text>
                  <Text style={s.cardValue}>{bank.ifsc_code}</Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={s.note}>
            <Lock size={14} color={Colors.inkSecondary} strokeWidth={2} />
            <Text style={s.noteText}>Encrypted, and only used to send you ticket earnings after your events.</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', lineHeight: 20 },
  emptyCta: { marginTop: 4, minWidth: 180 },
  content: { paddingHorizontal: 20 },
  bigTitle: { paddingHorizontal: 0 },

  card: { height: 210, borderRadius: 24, overflow: 'hidden', padding: 22, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardKind: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, letterSpacing: 1.6, color: withOpacity(Colors.white, 0.7) },
  cardMain: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, letterSpacing: 1, color: Colors.white },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cardLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.2, color: withOpacity(Colors.white, 0.55), textTransform: 'uppercase' },
  cardValue: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.white, marginTop: 2, maxWidth: 180 },

  note: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 16, paddingHorizontal: 4 },
  noteText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 12.5, lineHeight: 18, color: Colors.inkSecondary },
})
