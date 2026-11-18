import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { ArrowLeft } from 'lucide-react-native'
import ApiService, { type EventSummary } from '@/api/apiService'
import { AppHeader, HeaderIconBtn, EventListCard } from '@/components/ui'
import { EventCard } from '@/components/events/EventCard'
import { TonightCarousel } from '@/components/home/HomeParts'
import { WOMEN_LOOKS, WOMEN_LAB_KEY, useWomenLook, womenPinStyle } from '@/components/events/womenLook'
import { useLabStore } from '@/store/labStore'
import { useProfile } from '@/hooks/useProfile'
import { Colors, FontFamily, EVENT_CARD_CAROUSEL_W, withOpacity } from '@/constants'
import { hSelection } from '@/lib/haptics'

const W = Dimensions.get('window').width
const COL = (W - 16 * 2 - 12) / 2

/**
 * Design lab (dev builds): every event card type with a women-only night, in
 * four looks. The pick applies across the app at once, so you can also go
 * and look at the real screens.
 */
export default function WomenLabScreen() {
  const insets = useSafeAreaInsets()
  const look = useWomenLook()
  const setPick = useLabStore(s => s.setPick)
  const { profile } = useProfile()
  const [women, setWomen] = useState<EventSummary[]>([])
  const [regular, setRegular] = useState<EventSummary | null>(null)
  const [others, setOthers] = useState<EventSummary[]>([])

  useEffect(() => {
    const city = profile?.city ?? 'Mumbai'
    ApiService.getEvents({ city, women_only: true }).then(r => setWomen(r.slice(0, 2))).catch(() => {})
    ApiService.getEvents({ city }).then(r => {
      const plain = r.filter(e => (e.women_pct ?? 0) < 100)
      setRegular(plain[0] ?? null)
      setOthers(plain.slice(1, 2))
    }).catch(() => {})
  }, [profile?.city])

  // Men don't get women-only nights from the server, so they see a stand-in.
  const sample = women[0] ?? (regular ? { ...regular, id: `${regular.id}-women`, title: 'Girls Night Out', women_pct: 100 } : null)
  const second = women[1] ?? (others[0] ? { ...others[0], id: `${others[0].id}-women`, women_pct: 100 } : sample)
  const current = WOMEN_LOOKS.find(l => l.key === look)!

  return (
    <View style={s.root}>
      <AppHeader
        title="Women-only cards"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />
      <View style={s.picker}>
        {WOMEN_LOOKS.map(l => (
          <Pressable
            key={l.key}
            onPress={() => { if (l.key !== look) { hSelection(); setPick(WOMEN_LAB_KEY, l.key) } }}
            style={[s.opt, l.key === look && s.optOn]}
          >
            <Text style={[s.optKey, l.key === look && s.optKeyOn]}>{l.key.toUpperCase()}</Text>
            <Text style={[s.optName, l.key === look && s.optNameOn]} numberOfLines={1}>{l.name}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.line}>{current.line}. Applies everywhere in the app right now.</Text>

      {!sample ? (
        <Text style={s.empty}>No women-only events in {profile?.city ?? 'your city'} to show. Switch city or create one.</Text>
      ) : (
        <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          <Section title="Poster card" where="Events grid, Trending">
            <View style={s.grid}>
              <View style={{ width: COL }}><EventCard event={sample} onPress={() => {}} /></View>
              {regular ? <View style={{ width: COL }}><EventCard event={regular} onPress={() => {}} /></View> : null}
            </View>
          </Section>

          <Section title="Rail card" where="You're Going, You're Hosting, profile rails">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              <View style={{ width: EVENT_CARD_CAROUSEL_W }}><EventCard event={second} showHost onPress={() => {}} /></View>
              {regular ? <View style={{ width: EVENT_CARD_CAROUSEL_W }}><EventCard event={regular} showHost onPress={() => {}} /></View> : null}
            </ScrollView>
          </Section>

          <Section title="Row card" where="Recently viewed, calendar, map strip, list view">
            <View style={{ gap: 10 }}>
              <EventListCard event={sample} onPress={() => {}} />
              {regular ? <EventListCard event={regular} onPress={() => {}} /> : null}
            </View>
          </Section>

          <Section title="Big poster" where={"Home, \"This week in your city\""}>
            <TonightCarousel events={regular ? [sample, regular] : [sample]} city={profile?.city} />
          </Section>

          <Section title="Map pin" where="Events map">
            <View style={s.pins}>
              {[sample, regular].filter(Boolean).map((e, i) => (
                <View key={e!.id} style={[s.pin, i === 0 && womenPinStyle(look)]}>
                  {e!.cover_photos?.[0]?.url ? <Image source={{ uri: e!.cover_photos[0].url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
                </View>
              ))}
            </View>
          </Section>
        </ScrollView>
      )}
    </View>
  )
}

function Section({ title, where, children }: { title: string; where: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={s.sectionWhere}>{where}</Text>
      <View style={{ marginTop: 12 }}>{children}</View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  picker: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 6 },
  opt: { flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.surface, alignItems: 'center', gap: 2 },
  optOn: { borderColor: Colors.inkPrimary, backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  optKey: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkSecondary },
  optKeyOn: { color: Colors.inkPrimary },
  optName: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkDisabled },
  optNameOn: { color: Colors.inkSecondary },
  line: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, paddingHorizontal: 16, paddingTop: 10 },
  empty: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, padding: 24, textAlign: 'center' },
  body: { paddingHorizontal: 16, paddingTop: 8, gap: 28 },
  section: {},
  sectionTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  sectionWhere: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, marginTop: 2 },
  grid: { flexDirection: 'row', gap: 12 },
  pins: { flexDirection: 'row', gap: 24, paddingVertical: 8, paddingLeft: 8 },
  pin: { width: 38, height: 47, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.surface },
})
