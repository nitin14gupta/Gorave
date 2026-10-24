import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { HeadphonesIcon, ChevronRight } from 'lucide-react-native'
import { BrandedRefreshControl } from '@/components/ui'
import { ParallaxScreen, POSTER } from '@/components/ui/ParallaxScreen'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { useWallet } from '@/hooks/useWallet'
import { WalletEmptyState } from '@/components/settings/WalletEmptyState'
import { WalletTransactionRow, WalletTxDivider } from '@/components/settings/WalletTransactionRow'

export default function WalletScreen() {
  const { balance, transactions, loading, refreshing, reload } = useWallet()

  return (
    <ParallaxScreen
      image={POSTER.cheers}
      eyebrow="GORAVE WALLET"
      title="Your credits"
      onBack={() => router.back()}
      refreshControl={<BrandedRefreshControl refreshing={refreshing} onRefresh={() => reload(true)} />}
      heroExtra={
        loading
          ? <ActivityIndicator color={Colors.white} style={{ alignSelf: 'flex-start', marginTop: 8 }} />
          : <Text style={s.balance}>₹{balance}</Text>
      }
    >
      <Text style={s.note}>Credits work on any Gorave event and expire 6 months after you get them.</Text>

      <Pressable style={s.info} onPress={() => router.push('/(settings)/support' as any)}>
        <View style={s.infoIcon}><HeadphonesIcon size={16} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.infoTitle}>Need a bank refund?</Text>
          <Text style={s.infoSub}>Write to support and we will sort it out.</Text>
        </View>
        <ChevronRight size={18} color={Colors.inkDisabled} />
      </Pressable>

      {transactions.length > 0 ? (
        <>
          <Text style={s.label}>HISTORY</Text>
          <View style={s.list}>
            {transactions.map((t, i) => (
              <View key={t.id}>
                {i > 0 ? <WalletTxDivider /> : null}
                <WalletTransactionRow item={t} />
              </View>
            ))}
          </View>
        </>
      ) : !loading ? <WalletEmptyState /> : null}
    </ParallaxScreen>
  )
}

const s = StyleSheet.create({
  balance: { fontFamily: FontFamily.displayExtraBold, fontSize: 56, letterSpacing: -1.5, color: Colors.white, marginTop: 2 },
  note: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 19, color: Colors.inkSecondary, marginBottom: 6 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  infoIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  infoSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled, marginTop: 16, marginBottom: 2 },
  list: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.divider },
})
