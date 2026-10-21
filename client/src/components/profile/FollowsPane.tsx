import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Users } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { BrandedRefreshControl } from '@/components/ui'
import { useLabVariant } from '@/store/labStore'
import { FollowRowA } from '@/components/lab/follows/FollowRowA'
import { FollowCardB } from '@/components/lab/follows/FollowCardB'
import { PeopleListSkeleton } from '@/components/profile/PeopleListSkeleton'
import type { FollowUser } from '@/api/apiService'
import type { useFollowsList } from '@/hooks/useFollowsList'

type FollowsList = ReturnType<typeof useFollowsList>
type PaneType = 'followers' | 'following'

interface Props {
  type: PaneType
  list: FollowsList
  sorted: FollowUser[]
  bottomInset: number
  onFollow: (id: string) => void
  onUnfollow: (user: FollowUser) => void
  onRemove: (user: FollowUser) => void
  onDots: (user: FollowUser) => void
}

const emptyText = (type: PaneType, list: FollowsList) =>
  list.query.trim()
    ? 'No results'
    : type === 'followers'
      ? (list.isMyProfile ? 'No one is vibing you yet' : 'No vibers yet')
      : (list.isMyProfile ? "You're not vibing anyone yet" : 'Not vibing anyone yet')

export function FollowsPane({ type, list, sorted, bottomInset, onFollow, onUnfollow, onRemove, onDots }: Props) {
  const grid = useLabVariant('follows') === 'b'
  if (list.loading) return <PeopleListSkeleton />

  if (list.error && sorted.length === 0) {
    return (
      <View style={s.center}>
        <Text style={s.emptyTitle}>Something went wrong</Text>
        <Pressable onPress={() => list.load()} style={s.retryBtn} android_ripple={null}>
          <Text style={s.retryText}>Tap to retry</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <FlashList
      key={grid ? 'grid' : 'list'}
      data={sorted}
      keyExtractor={u => u.id}
      numColumns={grid ? 2 : 1}
      renderItem={({ item }) => {
        const props = {
          user: item,
          type,
          isMyProfile: list.isMyProfile,
          onFollow,
          onUnfollow: () => onUnfollow(item),
          onRemove: () => onRemove(item),
          onDots,
        }
        return grid ? <View style={s.cell}><FollowCardB {...props} /></View> : <FollowRowA {...props} />
      }}
      ItemSeparatorComponent={null}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.4}
      contentContainerStyle={{ paddingBottom: bottomInset + 16, paddingTop: grid ? 12 : 4, paddingHorizontal: grid ? 16 : 0 }}
      refreshControl={
        <BrandedRefreshControl
          refreshing={list.refreshing}
          onRefresh={() => list.load(true)}
        />
      }
      ListEmptyComponent={
        <View style={s.center}>
          <Users size={48} color={Colors.elevated} strokeWidth={1} />
          <Text style={s.emptyTitle}>{emptyText(type, list)}</Text>
        </View>
      }
      ListFooterComponent={
        list.loadingMore
          ? <View style={s.loadingMore}><ActivityIndicator size="small" color={Colors.inkSecondary} /></View>
          : null
      }
    />
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  loadingMore: { paddingVertical: 20, alignItems: 'center' },
  cell: { flex: 1, alignItems: 'center' },
  emptyTitle: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 15,
    color: Colors.inkSecondary, textAlign: 'center',
  },
  retryBtn: {
    marginTop: 4, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.divider,
  },
  retryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
})
