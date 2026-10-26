import { useCallback, useEffect } from 'react'
import { View, Text, StyleSheet, Modal, FlatList, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { X } from 'lucide-react-native'
import { hTap, hSelection } from '@/lib/haptics'
import { Colors, FontFamily, FILTER_CHIPS, matchesChip, withOpacity } from '@/constants'
import { Screen, SearchBar, EventListCard, EventListCardSkeleton, LogoMark } from '@/components/ui'
import { useEventSearch } from '@/hooks/useEventSearch'
import { useRecentEventsStore } from '@/store/recentEventsStore'
import type { EventSummary } from '@/api/apiService'

interface Props {
  visible: boolean
  onClose: () => void
  nearbyEvents: EventSummary[]
  lat?: number | null
  lng?: number | null
  nearbyLoading?: boolean
}

/**
 * Search events. A big title and search field, filter chips always in view,
 * and before you type: what you looked at recently, what you host, and
 * what's nearby. Results use the same event rows as everywhere else.
 */
export function EventSearchModal({ visible, onClose, nearbyEvents, lat, lng, nearbyLoading }: Props) {
  const {
    query, setQuery,
    chipKey, setChipKey,
    results, loading, searched, searchError,
    hostedEvents, hostedLoading, fetchHostedOnce,
  } = useEventSearch(lat, lng)
  const recent = useRecentEventsStore(st => st.events)

  useEffect(() => {
    if (visible) fetchHostedOnce()
  }, [visible])

  const openEvent = useCallback((id: string) => {
    router.push(`/(events)/${id}` as any)
    onClose()
  }, [onClose])

  const isSearching = query.trim().length > 0
  const hostedIds = new Set(hostedEvents.map(e => e.id))
  const nearbyFiltered = nearbyEvents
    .filter(e => !hostedIds.has(e.id))
    .filter(e => matchesChip(e, chipKey))
    .slice(0, 12)
  const recentFiltered = recent
    .filter(e => !hostedIds.has(e.id))
    .filter(e => matchesChip(e, chipKey))
    .slice(0, 4)

  const renderCard = useCallback((item: EventSummary) => (
    <View style={s.cardWrap}>
      <EventListCard event={item} onPress={() => openEvent(item.id)} />
    </View>
  ), [openEvent])

  const renderListItem = useCallback(({ item }: { item: EventSummary }) => renderCard(item), [renderCard])

  const browseHeader = (
    <View style={s.section}>
      {recentFiltered.length > 0 ? (
        <>
          <Text style={s.sectionTitle}>RECENTLY VIEWED</Text>
          {recentFiltered.map(item => <View key={`r-${item.id}`}>{renderCard(item)}</View>)}
        </>
      ) : null}
      {chipKey === 'all' && hostedEvents.length > 0 ? (
        <>
          <Text style={[s.sectionTitle, recentFiltered.length > 0 && s.sectionGap]}>YOU&apos;RE HOSTING</Text>
          {hostedEvents.map(item => <View key={`h-${item.id}`}>{renderCard(item)}</View>)}
        </>
      ) : null}
      <Text style={[s.sectionTitle, (recentFiltered.length > 0 || hostedEvents.length > 0) && s.sectionGap]}>NEARBY</Text>
    </View>
  )

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Screen bottom={false}>
        <View style={s.header}>
          <Text style={s.title}>Search</Text>
          <Pressable onPress={() => { hTap(); onClose() }} style={s.iconBtn} hitSlop={8}>
            <X size={20} color={Colors.inkPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>

        <SearchBar
          variant="glass"
          value={query}
          onChangeText={setQuery}
          placeholder="Event name, area or host"
          autoFocus
          style={s.searchWrap}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={s.chipsScroll}
          contentContainerStyle={s.chipsRow}
        >
          {FILTER_CHIPS.map(chip => {
            const on = chipKey === chip.key
            return (
              <Pressable key={chip.key} onPress={() => { hSelection(); setChipKey(chip.key) }} style={[s.chip, on && s.chipActive]}>
                <Text style={[s.chipText, on && s.chipTextActive]}>{chip.label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {isSearching ? (
          loading ? (
            <View style={s.listContent}>
              {Array.from({ length: 4 }).map((_, i) => <EventListCardSkeleton key={i} />)}
            </View>
          ) : searchError ? (
            <View style={s.center}>
              <Text style={s.emptyTitle}>Search didn&apos;t go through</Text>
              <Text style={s.emptySub}>Check your connection and try again.</Text>
            </View>
          ) : searched && results.length === 0 ? (
            <View style={s.center}>
              <LogoMark size={64} opacity={0.1} style={{ marginBottom: 4 }} />
              <Text style={s.emptyTitle}>Nothing for “{query.trim()}”</Text>
              <Text style={s.emptySub}>Try a different name, area or host.</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={e => e.id}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={results.length ? <Text style={s.sectionTitle}>{results.length} {results.length === 1 ? 'RESULT' : 'RESULTS'}</Text> : null}
              renderItem={renderListItem}
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={7}
            />
          )
        ) : (
          <FlatList
            data={nearbyFiltered}
            keyExtractor={e => e.id}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={browseHeader}
            ListEmptyComponent={
              !hostedLoading && !nearbyLoading ? (
                <View style={s.center}>
                  <LogoMark size={64} opacity={0.1} style={{ marginBottom: 4 }} />
                  <Text style={s.emptyTitle}>Nothing nearby yet</Text>
                  <Text style={s.emptySub}>Check back soon, or try a different city.</Text>
                </View>
              ) : null
            }
            renderItem={renderListItem}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={7}
          />
        )}
      </Screen>
    </Modal>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 34, letterSpacing: -1, color: Colors.inkPrimary },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.08),
    alignItems: 'center', justifyContent: 'center',
  },

  searchWrap: { marginHorizontal: 16, marginTop: 10, marginBottom: 10 },

  chipsScroll: { flexGrow: 0, flexShrink: 0, marginBottom: 12 },
  chipsRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14, height: 36, justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1, borderColor: Colors.divider,
  },
  chipActive: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  chipText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  chipTextActive: { color: Colors.background },

  listContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  section: { gap: 10 },
  sectionTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled, marginBottom: 2 },
  sectionGap: { marginTop: 14 },

  cardWrap: { marginBottom: 4 },

  center: { alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 },
  emptyTitle: { fontFamily: FontFamily.displayExtraBold, fontSize: 22, letterSpacing: -0.4, color: Colors.inkPrimary, textAlign: 'center' },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
})
