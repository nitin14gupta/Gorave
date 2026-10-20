import { useEffect, type ReactNode, type ReactElement } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Colors, FontFamily } from '@/constants'
import { EventListCard, EventListCardSkeleton, PrimaryButton, BrandedRefreshControl } from '@/components/ui'
import { EventCardSkeletonList } from '@/components/events/EventCard'
import { useEventCardVariant, eventCardColumns, eventGridCellWidth, EVENT_GRID_GAP } from '@/store/eventCardVariantStore'
import type { useMyEventsPage } from '@/hooks/useMyEventsPage'
import type { EventSummary } from '@/api/apiService'

export type EventsTab = 'upcoming' | 'past'

export function EventsPane({
  active, page, viewMode, emptyIcon, emptyTitle, emptySub, emptyCta, renderCard,
}: {
  active: boolean
  page: ReturnType<typeof useMyEventsPage>
  viewMode: 'card' | 'list'
  emptyIcon: ReactNode
  emptyTitle: string
  emptySub: string
  emptyCta?: { label: string; icon?: ReactNode; onPress: () => void }
  renderCard: (item: EventSummary) => ReactElement
}) {
  // Fetch once, cached after that — swiping between tabs never re-fetches.
  useEffect(() => { if (active && !page.loaded) page.fetchFirstPage(false) }, [active, page.loaded])
  const variant = useEventCardVariant()
  // Posters sit two per row; ticket rows and the compact list are one per row.
  const cols = viewMode === 'card' ? eventCardColumns(variant) : 1
  const cellW = eventGridCellWidth(16)

  if (page.loading) {
    return (
      <View style={s.listContent}>
        {viewMode === 'list'
          ? Array.from({ length: 4 }).map((_, i) => <EventListCardSkeleton key={i} />)
          : <EventCardSkeletonList count={4} cellWidth={cellW} />}
      </View>
    )
  }

  if (page.events.length === 0) {
    return (
      <View style={s.center}>
        {emptyIcon}
        <Text style={s.emptyTitle}>{emptyTitle}</Text>
        <Text style={s.emptySub}>{emptySub}</Text>
        {emptyCta && (
          <PrimaryButton label={emptyCta.label} icon={emptyCta.icon} size="small" style={s.ctaBtn} onPress={emptyCta.onPress} />
        )}
      </View>
    )
  }

  return (
    <FlatList
      key={`cols-${cols}`}
      data={page.events}
      numColumns={cols}
      columnWrapperStyle={cols > 1 ? { gap: EVENT_GRID_GAP } : undefined}
      keyExtractor={e => e.id}
      contentContainerStyle={s.listContent}
      showsVerticalScrollIndicator={false}
      onEndReached={page.loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={
        <BrandedRefreshControl refreshing={page.refreshing} onRefresh={() => page.fetchFirstPage(true)} />
      }
      ListFooterComponent={
        page.loadingMore ? (
          <View style={s.footerLoader}>
            <ActivityIndicator color={Colors.inkSecondary} />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        viewMode === 'list' ? (
          <EventListCard event={item} onPress={() => router.push(`/(events)/${item.id}` as any)} />
        ) : cols > 1 ? (
          <View style={{ width: cellW }}>{renderCard(item)}</View>
        ) : (
          renderCard(item)
        )
      )}
    />
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  ctaBtn: { marginTop: 8 },
  listContent: { padding: 16, gap: 16 },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
})
