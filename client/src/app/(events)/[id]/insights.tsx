import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import ApiService from '@/api/apiService'
import { AppHeader, HeaderIconBtn, BrandedLoader } from '@/components/ui'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hSelection } from '@/lib/haptics'

interface Insights {
  viewers: number
  views: number
  saves: number
  going: number
  requests: number
  waitlist: number
  capacity: number
  conversion_pct: number | null
  days: { day: string; views: number; bookings: number }[]
  paid: boolean
  revenue_inr: number
  you_get_inr: number
  by_deal: { kind: 'early_bird' | 'promo' | 'full'; code: string | null; tickets: number; revenue: number }[]
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const dealName = (d: Insights['by_deal'][number]) => d.kind === 'early_bird' ? 'Early bird' : d.kind === 'promo' ? `Code ${d.code}` : 'Full price'

/**
 * How the night is doing, for its host: who looked, who saved it, who booked,
 * and for paid nights what each deal sold. Numbers keep good hosts hosting.
 */
export default function InsightsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [data, setData] = useState<Insights | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [picked, setPicked] = useState<number | null>(null)

  useFocusEffect(useCallback(() => {
    if (!id) return
    ApiService.get<Insights>(`/events/${id}/insights`).then(setData).catch((e: any) => setError(e?.message || "Couldn't load insights"))
  }, [id]))

  const header = (
    <AppHeader
      title="Insights"
      leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
    />
  )
  if (!data) return <View style={s.root}>{header}<View style={s.center}>{error ? <Text style={s.muted}>{error}</Text> : <BrandedLoader />}</View></View>

  const maxB = Math.max(1, ...data.days.map(d => d.bookings))
  const sel = picked != null ? data.days[picked] : null
  const weekBookings = data.days.reduce((n, d) => n + d.bookings, 0)
  const maxRev = Math.max(1, ...data.by_deal.map(d => d.revenue))

  return (
    <View style={s.root}>
      {header}
      <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <View style={s.tiles}>
          <Tile label="People who looked" value={String(data.viewers)} sub={data.views > data.viewers ? `${data.views} visits` : undefined} />
          <Tile label="Saved it" value={String(data.saves)} />
          <Tile label="Going" value={`${data.going}`} sub={`of ${data.capacity}`} />
          <Tile label="Looked, then booked" value={data.conversion_pct != null ? `${data.conversion_pct}%` : '–'} />
        </View>
        {data.requests || data.waitlist ? (
          <Text style={s.note}>{[data.requests ? `${data.requests} waiting for you to let them in` : null, data.waitlist ? `${data.waitlist} on the waitlist` : null].filter(Boolean).join(' · ')}</Text>
        ) : null}

        {/* Bookings this week: one series, one axis. Tap a day for its numbers. */}
        <View style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Bookings this week</Text>
            <Text style={s.cardValue}>{sel ? `${sel.bookings} booked · ${sel.views} looked` : `${weekBookings} total`}</Text>
          </View>
          <View style={s.chart}>
            {data.days.map((d, i) => (
              <Pressable
                key={d.day}
                style={s.col}
                onPress={() => { hSelection(); setPicked(picked === i ? null : i) }}
                accessibilityLabel={`${DOW[new Date(d.day).getDay()]}: ${d.bookings} booked, ${d.views} looked`}
              >
                <View style={s.barTrack}>
                  <View style={[s.bar, { height: `${Math.max(d.bookings ? 6 : 0, (d.bookings / maxB) * 100)}%` }, picked != null && picked !== i && s.barDim]} />
                </View>
                <Text style={[s.dayLabel, picked === i && s.dayOn]}>{DOW[new Date(d.day).getDay()]}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {data.paid ? (
          <View style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.cardTitle}>You get</Text>
              <Text style={s.big}>{inr(data.you_get_inr)}</Text>
            </View>
            <Text style={s.muted}>From {inr(data.revenue_inr)} in tickets, after Gorave&apos;s 10%. Paid out after the night.</Text>
            {data.by_deal.length ? <Text style={[s.cardTitle, { marginTop: 18, fontSize: 15 }]}>What sold</Text> : null}
            {data.by_deal.map(d => (
              <View key={`${d.kind}-${d.code}`} style={s.dealRow}>
                <View style={s.dealTop}>
                  <Text style={s.dealName}>{dealName(d)}</Text>
                  <Text style={s.dealNums}>{d.tickets} {d.tickets === 1 ? 'ticket' : 'tickets'} · {inr(d.revenue)}</Text>
                </View>
                <View style={s.hTrack}><View style={[s.hBar, { width: `${(d.revenue / maxRev) * 100}%` }]} /></View>
              </View>
            ))}
            {!data.by_deal.length ? <Text style={[s.muted, { marginTop: 10 }]}>No tickets sold yet. A deal can get the first few in.</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={s.tile}>
      <Text style={s.tileValue}>{value}{sub ? <Text style={s.tileSub}> {sub}</Text> : null}</Text>
      <Text style={s.tileLabel}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  body: { paddingHorizontal: 20, paddingTop: 6, gap: 14 },
  muted: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary },
  note: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary, marginTop: -4 },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '48.5%', flexGrow: 1, padding: 14, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  tileValue: { fontFamily: FontFamily.displayExtraBold, fontSize: 28, letterSpacing: -0.8, color: Colors.inkPrimary },
  tileSub: { fontFamily: FontFamily.bodyMedium, fontSize: 13, letterSpacing: 0, color: Colors.inkSecondary },
  tileLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary, marginTop: 2 },

  card: { padding: 16, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  cardValue: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  big: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, letterSpacing: -0.6, color: Colors.inkPrimary },

  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 130, marginTop: 10 },
  col: { flex: 1, height: '100%', alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  // Thin mark, rounded only at its data end, anchored to the baseline.
  bar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: Colors.inkPrimary },
  barDim: { opacity: 0.3 },
  dayLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkDisabled },
  dayOn: { color: Colors.inkPrimary },

  dealRow: { marginTop: 12, gap: 6 },
  dealTop: { flexDirection: 'row', justifyContent: 'space-between' },
  dealName: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  dealNums: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  hTrack: { height: 6, borderRadius: 3, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), overflow: 'hidden' },
  hBar: { height: 6, borderRadius: 3, backgroundColor: Colors.inkPrimary },
})
