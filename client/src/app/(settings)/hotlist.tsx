import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Bookmark } from 'lucide-react-native'
import { APP_HEADER_BAR_HEIGHT, HeaderIconBtn, PrimaryButton, BrandedRefreshControl } from '@/components/ui'
import { ScrollFade } from '@/components/ui/ScrollFade'
import { LargeTitle, LargeTitleBar, useLargeTitle } from '@/components/ui/LargeTitle'
import ApiService, { type EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { Colors, FontFamily, Spacing, EVENT_GRID_GAP, eventGridCellWidth } from '@/constants'

export default function HotlistScreen() {
  const { scrollY, onScroll } = useLargeTitle()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const [events, setEvents] = useState<EventSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await ApiService.getMyHotlistEvents()
      setEvents(data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const cols = 2
  const [scrolled, setScrolled] = useState(false)
  const cellW = eventGridCellWidth(Spacing.screenPadding)

  return (
    <View style={s.root}>
      <LargeTitleBar
        title="Hotlist"
        scrollY={scrollY}
        pinned={loading || events.length === 0}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      {loading ? (
        <View style={[s.center, { paddingTop: headerHeight }]}>
          <ActivityIndicator color={Colors.inkSecondary} />
        </View>
      ) : events.length === 0 ? (
        <View style={[s.center, { paddingTop: headerHeight }]}>
          <Bookmark size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>Your hotlist is empty</Text>
          <Text style={s.emptySub}>Tap the save icon on any event to add it here for later.</Text>
          <PrimaryButton label="Browse Events" size="small" style={s.emptyCta} onPress={() => router.navigate('/(tabs)/events')} />
        </View>
      ) : (
        <FlatList
          key={`cols-${cols}`}
          data={events}
          numColumns={cols}
          columnWrapperStyle={cols > 1 ? { gap: EVENT_GRID_GAP } : undefined}
          keyExtractor={e => e.id}
          contentContainerStyle={[s.list, { paddingTop: headerHeight }]}
          ListHeaderComponent={<LargeTitle title="Hotlist" scrollY={scrollY} style={s.bigTitle} />}
          onScroll={e => { onScroll(e); setScrolled(e.nativeEvent.contentOffset.y > 8) }}
          scrollEventThrottle={16}
          refreshControl={<BrandedRefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <View style={cols > 1 ? { width: cellW } : undefined}>
              <EventCard event={item} onPress={() => router.push(`/(events)/${item.id}` as any)} />
            </View>
          )}
        />
      )}
      <ScrollFade visible={scrolled} height={insets.top + 90} />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 20,
  },
  emptyCta: { marginTop: 4, minWidth: 180 },
  list: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 40, gap: 16 },
  bigTitle: { paddingHorizontal: 0, paddingBottom: 0 },
})
