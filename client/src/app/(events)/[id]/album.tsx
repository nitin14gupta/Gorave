import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Camera, Flag, ImagePlus, PartyPopper, Trash2 } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ApiService, { type AlbumPhoto } from '@/api/apiService'
import { MediaPreviewModal } from '@/components/chat/MediaPreviewModal'
import { MediaViewerModal } from '@/components/chat/MediaViewerModal'
import { AlbumPhotoSheet, type AlbumSheetMode } from '@/components/events/AlbumPhotoSheet'
import { VoteBurst } from '@/components/events/VoteBurst'
import { BrandedRefreshControl, EmptyState, HeaderIconBtn, PrimaryButton } from '@/components/ui'
import { LargeTitleBar, useLargeTitle } from '@/components/ui/LargeTitle'
import { useAlbum } from '@/hooks/useAlbum'
import { photosLabel } from '@/lib/album'
import { parseServerDate } from '@/lib/dates'
import { hSuccess, hTap } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { Colors, FontFamily, withOpacity } from '@/constants'

const GAP = 2
const COLUMNS = 3
const CELL_W = (Dimensions.get('window').width - GAP * (COLUMNS - 1)) / COLUMNS
const CELL_H = CELL_W * 1.25 // 4:5, like every event photo
const BEST_W = Dimensions.get('window').width * 0.4
const BURST_MS = 800

function closingLine(closesAt: string | null) {
  const d = closesAt ? parseServerDate(closesAt) : null
  if (!d) return null
  return `Add until ${d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`
}

/** After-party album: everyone who was there, in one grid. Only they can see it. */
export default function AlbumScreen() {
  const { id, add } = useLocalSearchParams<{ id: string; add?: string }>()
  const insets = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)
  const { scrollY, onScroll, barHeight } = useLargeTitle()
  const album = useAlbum(id!)
  const [viewIndex, setViewIndex] = useState<number | null>(null)
  const [sheet, setSheet] = useState<{ mode: AlbumSheetMode; photo: AlbumPhoto } | null>(null)
  const [burst, setBurst] = useState(0)
  // The viewer runs through Best of the night first, then the grid.
  const all = useMemo(() => [...album.best, ...album.photos], [album.best, album.photos])
  const viewerItems = useMemo(() => all.map(p => ({ url: p.url, type: 'image' as const, cacheKey: p.key })), [all])
  useEffect(() => {
    if (!burst) return
    const t = setTimeout(() => setBurst(0), BURST_MS)
    return () => clearTimeout(t)
  }, [burst])

  const voteFor = (photo: AlbumPhoto) => {
    if (photo.mine) return
    hSuccess()
    setBurst(n => n + 1)
    if (!photo.voted) album.setVote(photo, true)
  }

  // "Add photos" on Home goes straight to the picker.
  const autoOpened = useRef(false)
  useEffect(() => {
    if (add !== '1' || autoOpened.current || album.loading || !album.canAdd) return
    autoOpened.current = true
    void album.addPhotos()
  }, [add, album])

  const footerFor = (index: number) => {
    const p = all[index]
    if (!p) return null
    return (
      <View style={[s.viewerFooter, { paddingBottom: insets.bottom + 16 }]}>
        <Image source={p.uploader.avatar ? { uri: p.uploader.avatar } : undefined} style={s.viewerAvatar} />
        <Text style={s.viewerName} numberOfLines={1}>{p.mine ? 'You' : p.uploader.name ?? 'A guest'}</Text>
        {!p.mine ? (
          <Pressable
            style={[s.viewerBtn, p.voted && s.viewerBtnOn]}
            hitSlop={8}
            accessibilityLabel={p.voted ? 'Take back Best of the night' : 'Best of the night'}
            onPress={() => { if (p.voted) { hTap(); album.setVote(p, false) } else voteFor(p) }}
          >
            <PartyPopper size={18} color={p.voted ? Colors.background : Colors.white} strokeWidth={2} />
          </Pressable>
        ) : null}
        {p.can_delete ? (
          <Pressable style={s.viewerBtn} hitSlop={8} accessibilityLabel="Remove photo" onPress={() => { hTap(); setSheet({ mode: 'remove', photo: p }) }}>
            <Trash2 size={18} color={Colors.white} strokeWidth={2} />
          </Pressable>
        ) : null}
        {!p.mine ? (
          <Pressable style={s.viewerBtn} hitSlop={8} accessibilityLabel="Report photo" onPress={() => { hTap(); setSheet({ mode: 'report', photo: p }) }}>
            <Flag size={18} color={Colors.white} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
    )
  }

  const removePhoto = async (photo: AlbumPhoto) => {
    await album.remove(photo)
    setSheet(null)
    showPill('Photo removed', 'success')
  }

  const blockUploader = async (photo: AlbumPhoto) => {
    await ApiService.blockUser(photo.uploader.id)
    await album.refresh()
    setSheet(null)
    showPill(`Blocked ${photo.uploader.name?.split(' ')[0] ?? 'them'}`, 'success')
  }

  const removeAllFrom = async (photo: AlbumPhoto) => {
    await album.removeUploader(photo.uploader.id)
    setSheet(null)
    showPill(`Removed ${photo.uploader.name?.split(' ')[0] ?? 'their'} photos`, 'success')
  }

  const meta = [photosLabel(album.count), album.canAdd ? closingLine(album.closesAt) : 'Closed for new photos'].filter(Boolean).join(' · ')
  const header = all.length > 0 ? (
    <>
      <View style={s.intro}>
        <Text style={s.meta}>{meta}</Text>
        <Text style={s.private}>Only people who were there can see these. Double tap your favourite moments.</Text>
      </View>
      {album.best.length > 0 ? (
        <View style={s.best}>
          <Text style={s.bestTitle}>Best of the night</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bestRow}>
            {album.best.map((p, i) => (
              <Pressable key={p.id} onPress={() => { hTap(); setViewIndex(i) }} accessibilityLabel="Open photo">
                <Image source={{ uri: p.url, cacheKey: p.key }} style={s.bestTile} contentFit="cover" cachePolicy="memory-disk" transition={200} />
                {p.voted ? <View style={s.mark}><PartyPopper size={13} color={Colors.background} strokeWidth={2.2} /></View> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </>
  ) : null

  const uploading = album.upload && album.upload.done < album.upload.total
  const failedCount = album.upload && !uploading ? album.upload.failed.length : 0

  return (
    <View style={s.root}>
      <LargeTitleBar
        title="After-party album"
        scrollY={scrollY}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      {album.loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.inkPrimary} /></View>
      ) : album.error && album.photos.length === 0 ? (
        <View style={[s.center, { paddingTop: barHeight }]}>
          <EmptyState icon={<Camera size={52} color={Colors.inkDisabled} strokeWidth={1.2} />} title="Can't open this album" subtitle={album.error} />
        </View>
      ) : (
        <FlatList
          data={album.photos}
          keyExtractor={p => p.id}
          numColumns={COLUMNS}
          columnWrapperStyle={s.row}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={s.empty}>
              <EmptyState
                icon={<Camera size={52} color={Colors.inkDisabled} strokeWidth={1.2} />}
                title="Be the first to drop a pic"
                subtitle={album.canAdd ? 'Only people who were there can see them.' : 'Nobody added photos to this night.'}
              />
            </View>
          }
          contentContainerStyle={{ paddingTop: barHeight, paddingBottom: insets.bottom + 110 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onEndReached={album.loadMore}
          onEndReachedThreshold={0.6}
          initialNumToRender={15}
          maxToRenderPerBatch={12}
          windowSize={7}
          refreshControl={<BrandedRefreshControl refreshing={album.refreshing} onRefresh={album.refresh} />}
          renderItem={({ item, index }) => (
            <Pressable onPress={() => { hTap(); setViewIndex(album.best.length + index) }} accessibilityLabel="Open photo">
              <Image source={{ uri: item.url, cacheKey: item.key }} style={s.cell} contentFit="cover" cachePolicy="memory-disk" transition={120} />
              {item.voted ? <View style={s.mark}><PartyPopper size={13} color={Colors.background} strokeWidth={2.2} /></View> : null}
            </Pressable>
          )}
        />
      )}

      {album.canAdd || uploading ? (
        <View style={[s.dock, { paddingBottom: insets.bottom + 12 }]}>
          {uploading ? (
            <View style={s.progress}>
              <Text style={s.progressText}>Adding {Math.min(album.upload!.done + 1, album.upload!.total)} of {album.upload!.total}</Text>
              <View style={s.track}><View style={[s.fill, { width: `${(album.upload!.done / album.upload!.total) * 100}%` }]} /></View>
            </View>
          ) : failedCount > 0 ? (
            <View style={s.failed}>
              <Text style={s.failedText}>{failedCount} didn&apos;t upload</Text>
              <View style={s.failedActions}>
                <Pressable onPress={album.dismissFailed} hitSlop={8}><Text style={s.dismiss}>Dismiss</Text></Pressable>
                <Pressable onPress={album.retryFailed} hitSlop={8}><Text style={s.retry}>Try again</Text></Pressable>
              </View>
            </View>
          ) : (
            <PrimaryButton label="Add photos" onPress={album.addPhotos} icon={<ImagePlus size={18} color={Colors.background} strokeWidth={2} />} />
          )}
        </View>
      ) : null}

      <MediaPreviewModal
        media={album.pending}
        onSend={album.sendPending}
        onCancel={album.clearPending}
        onRemove={album.removePending}
        onUpdate={album.updatePending}
        actionLabel={album.pending.length > 1 ? `Add ${album.pending.length} photos` : 'Add photo'}
        titleLabel="Add to the album?"
        freeStyleCrop
      />
      <MediaViewerModal
        visible={viewIndex != null && viewerItems.length > 0}
        items={viewerItems}
        initialIndex={viewIndex ?? 0}
        onClose={() => setViewIndex(null)}
        onRequestClose={sheet ? () => setSheet(null) : undefined}
        renderFooter={footerFor}
        onDoubleTap={index => { if (all[index]) voteFor(all[index]) }}
        overlay={<>
          {burst ? <VoteBurst key={burst} /> : null}
          {sheet ? (
          <AlbumPhotoSheet
            mode={sheet.mode}
            photo={sheet.photo}
            onReport={reason => album.report(sheet.photo, reason)}
            onRemove={() => removePhoto(sheet.photo)}
            onRemoveAll={sheet.photo.can_delete && !sheet.photo.mine ? () => removeAllFrom(sheet.photo) : undefined}
            onBlock={() => blockUploader(sheet.photo)}
            onClose={() => setSheet(null)}
            onReported={() => { album.forget(sheet.photo); setSheet(null) }}
          />
          ) : null}
        </>}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingTop: 90 },
  row: { gap: GAP, marginBottom: GAP },
  cell: { width: CELL_W, height: CELL_H, backgroundColor: Colors.surface },
  intro: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, gap: 2 },
  meta: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  private: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary },
  best: { gap: 10, paddingBottom: 18 },
  bestTitle: { paddingHorizontal: 16, fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  bestRow: { paddingHorizontal: 16, gap: 8 },
  bestTile: { width: BEST_W, height: BEST_W * 1.25, borderRadius: 14, backgroundColor: Colors.surface },
  mark: { position: 'absolute', right: 6, bottom: 6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: Colors.background },
  progress: { gap: 8, paddingVertical: 6 },
  progressText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  track: { height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: withOpacity(Colors.inkPrimary, 0.12) },
  fill: { height: 4, borderRadius: 2, backgroundColor: Colors.inkPrimary },
  failed: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  failedText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  failedActions: { flexDirection: 'row', gap: 18 },
  dismiss: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
  retry: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  viewerFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 40 },
  viewerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: withOpacity(Colors.white, 0.16) },
  viewerName: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.white },
  viewerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.white, 0.16) },
  viewerBtnOn: { backgroundColor: Colors.white },
})
