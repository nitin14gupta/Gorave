import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Download, Share2, X } from 'lucide-react-native'
import ApiService from '@/api/apiService'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'
import { setRecapFlag } from '@/lib/recapSeen'
import { useQrShare } from '@/hooks/useQrShare'
import { MonthRecapCard } from '@/components/recap/MonthRecapCard'
import type { MonthRecap } from '@/types/api'

// "Your month on Gorave", full screen. Opened by the 1st-of-the-month push,
// the notification row, the Home card, or once automatically (see
// MonthRecapBanner). `month` is YYYY-MM or "latest" (last month).
export default function MonthRecapScreen() {
  const { month } = useLocalSearchParams<{ month: string }>()
  const insets = useSafeAreaInsets()
  const { width: W, height: H } = useWindowDimensions()
  const [recap, setRecap] = useState<MonthRecap | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'none' | 'error'>('loading')

  // State starts as 'loading'; only a retry has to set it again.
  const load = useCallback(() => {
    ApiService.getMonthRecap(month)
      .then(r => {
        setRecap(r)
        setState('ready')
        setRecapFlag('revealed', r.month)
      })
      .catch((e: any) => setState(e?.code === 'NO_RECAP' ? 'none' : 'error'))
  }, [month])
  useEffect(load, [load])

  const message = recap ? `My ${recap.month_label} on Gorave. Find your next night on gorave.in` : ''
  const { cardRef, handleShare, handleSave } = useQrShare(message)

  const barH = insets.top + 8 + 38 + 12
  const actionsH = recap?.shareable ? 52 + 16 + insets.bottom + 16 : insets.bottom + 16
  const cardW = Math.floor(Math.min(W - 32, ((H - barH - actionsH) * 9) / 16))

  return (
    <View style={s.root}>
      <View style={[s.bar, { paddingTop: insets.top + 8 }]}>
        <Pressable style={s.close} onPress={() => { hTap(); router.back() }} hitSlop={8} accessibilityLabel="Close">
          <X size={18} color={Colors.inkPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={s.center}>
        {state === 'loading' && <ActivityIndicator color={Colors.inkSecondary} />}
        {state === 'none' && (
          <Text style={s.empty}>{"Your month on Gorave shows up on the 1st, once you've been to a night."}</Text>
        )}
        {state === 'error' && (
          <>
            <Text style={s.empty}>{"Couldn't load your month."}</Text>
            <Pressable style={s.retry} onPress={() => { setState('loading'); load() }}><Text style={s.retryText}>Try again</Text></Pressable>
          </>
        )}
        {state === 'ready' && recap && (
          <View style={s.cardShadow}>
            <MonthRecapCard
              ref={cardRef}
              recap={recap}
              width={cardW}
              onOpenEvent={id => router.push(`/(events)/${id}`)}
              onBrowse={() => router.push('/(tabs)/events')}
            />
          </View>
        )}
      </View>

      {state === 'ready' && recap?.shareable && (
        <View style={[s.actions, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable style={[s.action, s.actionPrimary]} onPress={() => { hTap(); handleShare() }}>
            <Share2 size={18} color={Colors.inkOnAccent} strokeWidth={2.2} />
            <Text style={[s.actionText, s.actionTextPrimary]}>Share</Text>
          </Pressable>
          <Pressable style={s.action} onPress={() => { hTap(); handleSave() }}>
            <Download size={18} color={Colors.inkPrimary} strokeWidth={2.2} />
            <Text style={s.actionText}>Save</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.deepBackground },
  bar: { paddingHorizontal: 16, paddingBottom: 12 },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.1), alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  cardShadow: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.divider },
  empty: { fontFamily: FontFamily.bodyMedium, fontSize: 15, lineHeight: 22, color: Colors.inkSecondary, textAlign: 'center', maxWidth: 280 },
  retry: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: Colors.divider },
  retryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  action: {
    flex: 1, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider,
  },
  actionPrimary: { backgroundColor: Colors.brandOrange, borderColor: Colors.brandOrange },
  actionText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  actionTextPrimary: { color: Colors.inkOnAccent },
})
