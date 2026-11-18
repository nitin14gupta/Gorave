import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { router } from 'expo-router'
import { X, Flame, Check } from 'lucide-react-native'
import { hTap, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import type { VibeRequest } from '@/api/apiService'

function RequestCardSkeleton() {
  return (
    <View style={s.skCard}>
      <View style={[s.cardAvatar, sk.avatar]} />
      <View style={s.cardInfo}>
        <View style={[sk.line, { width: '50%', marginBottom: 6 }]} />
        <View style={[sk.line, { width: '30%', marginBottom: 6 }]} />
        <View style={[sk.line, { width: '85%' }]} />
      </View>
    </View>
  )
}

const sk = StyleSheet.create({
  avatar: { backgroundColor: Colors.surfaceMuted },
  line: { height: 10, borderRadius: 5, backgroundColor: Colors.surfaceMuted },
})

interface Props {
  visible: boolean
  requests: VibeRequest[]
  loading?: boolean
  onBeginAccept: (vibeId: string, senderName: string | null) => void
  onPass: (vibeId: string) => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.65} />
}

/** "5m", "3h", "2d": when the vibe came in. */
function ago(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${Math.max(1, mins)}m`
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`
  return `${Math.round(mins / (60 * 24))}d`
}

// One compact row per vibe, so 20 in a day still fits on a screen or two:
// their photo (opens the profile), name, the message, and two round buttons.
function RequestCard({ req, onBeginAccept, onPass }: { req: VibeRequest; onBeginAccept: (id: string, name: string | null) => void; onPass: (id: string) => void }) {
  const [actioned, setActioned] = useState<'pending' | 'passed' | null>(null)
  const avatar = req.photos[0]?.url
  const first = (req.name ?? 'Someone').split(' ')[0]
  const openProfile = () => router.push(`/(profile)/${req.sender_id}` as any)

  return (
    <View style={[s.row, actioned && s.cardActioned]}>
      <Pressable style={s.photo} onPress={openProfile} accessibilityLabel={`Open ${first}'s profile`}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={150} />
        ) : (
          <Text style={s.photoInit}>{first.charAt(0)}</Text>
        )}
      </Pressable>

      <Pressable style={s.mid} onPress={openProfile}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{first}</Text>
          <Text style={s.meta} numberOfLines={1}>{[req.city, ago(req.created_at)].filter(Boolean).join(' · ')}</Text>
        </View>
        <Text style={s.message} numberOfLines={2}>{req.message}</Text>
      </Pressable>

      {actioned === 'pending' ? (
        <Check size={20} color={Colors.onlineGreen} strokeWidth={2.5} />
      ) : actioned === 'passed' ? (
        <Text style={s.actionedText}>Passed</Text>
      ) : (
        <View style={s.actions}>
          <Pressable style={s.passBtn} hitSlop={4} accessibilityLabel={`Pass on ${first}`} onPress={() => { hTap(); setActioned('passed'); onPass(req.id) }}>
            <X size={18} color={Colors.inkPrimary} strokeWidth={2.2} />
          </Pressable>
          <Pressable style={s.acceptBtn} hitSlop={4} accessibilityLabel={`Vibe back with ${first}`} onPress={() => { hSuccess(); setActioned('pending'); onBeginAccept(req.id, req.name) }}>
            <Flame size={18} color={Colors.background} fill={Colors.background} />
          </Pressable>
        </View>
      )}
    </View>
  )
}

function VibeInboxSheetCore({ requests, loading, onBeginAccept, onPass, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => { sheetRef.current?.present() }, [])

  const Header = (
    <View style={s.headerRow}>
      <View style={s.headerLeft}>
        <Text style={s.title}>Vibes for you</Text>
        {requests.length > 0 && (
          <View style={s.countBadge}><Text style={s.countBadgeText}>{requests.length}</Text></View>
        )}
      </View>
      <Pressable onPress={onClose} hitSlop={10}>
        <X size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
      </Pressable>
    </View>
  )

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['62%', '92%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      {loading ? (
        <BottomSheetView style={s.fullContent}>
          {Header}
          <AutoSkeletonView isLoading animationType="gradient" defaultRadius={16} gradientColors={[Colors.surfaceMuted, '#3a3a3a']}>
            <View style={{ gap: 10 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <RequestCardSkeleton key={i} />
              ))}
            </View>
          </AutoSkeletonView>
        </BottomSheetView>
      ) : requests.length === 0 ? (
        <BottomSheetView style={s.fullContent}>
          {Header}
          <View style={s.emptyBox}>
            <Flame size={40} color={Colors.inkDisabled} strokeWidth={1.2} />
            <Text style={s.emptyTitle}>No vibes yet</Text>
            <Text style={s.emptySub}>When someone sends you a vibe, it shows up here.</Text>
          </View>
        </BottomSheetView>
      ) : (
        <BottomSheetFlatList
          data={requests}
          keyExtractor={r => r.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={Header}
          ItemSeparatorComponent={() => <View style={s.divider} />}
          renderItem={({ item }) => <RequestCard req={item} onBeginAccept={onBeginAccept} onPass={onPass} />}
        />
      )}
    </BottomSheetModal>
  )
}

export function VibeInboxSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <VibeInboxSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.sheetBackground, borderRadius: 28 },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  fullContent: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 22, letterSpacing: -0.5, color: Colors.inkPrimary },
  countBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.inkPrimary, alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.background },
  skCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: Colors.surfaceMuted, padding: 12, gap: 12 },
  cardActioned: { opacity: 0.5 },
  cardAvatar: { width: 56, height: 56, borderRadius: 14 },
  cardInfo: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  // People photos are square.
  photo: { width: 56, height: 56, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  photoInit: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkDisabled },
  mid: { flex: 1, minWidth: 0, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  name: { flexShrink: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  meta: { flexShrink: 1, fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled },
  message: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary },
  actions: { flexDirection: 'row', gap: 8 },
  passBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  acceptBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.inkPrimary },
  actionedText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginLeft: 68 },
  emptyBox: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center' },
})
