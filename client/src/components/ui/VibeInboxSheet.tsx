import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
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

function RequestCard({ req, onBeginAccept, onPass }: { req: VibeRequest; onBeginAccept: (id: string, name: string | null) => void; onPass: (id: string) => void }) {
  const [actioned, setActioned] = useState<'pending' | 'passed' | null>(null)
  const avatar = req.photos[0]?.url
  const first = (req.name ?? 'Someone').split(' ')[0]

  return (
    <View style={[s.card, actioned && s.cardActioned]}>
      <Pressable style={s.photo} onPress={() => router.push(`/(profile)/${req.sender_id}` as any)}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={150} />
        ) : (
          <Text style={s.photoInit}>{first.charAt(0)}</Text>
        )}
        <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0,0,0,0.8)']} locations={[0.55, 1]} style={StyleSheet.absoluteFill} />
        <View style={s.photoInfo}>
          <Text style={s.photoName} numberOfLines={1}>{req.name ?? 'Someone'}</Text>
          {req.city ? <Text style={s.photoCity} numberOfLines={1}>{req.city}</Text> : null}
        </View>
      </Pressable>

      <View style={s.bubble}><Text style={s.bubbleText}>{req.message}</Text></View>

      {actioned === 'pending' ? (
        <View style={s.actionedBadge}><Check size={14} color={Colors.onlineGreen} strokeWidth={2.5} /><Text style={s.actionedText}>Opening…</Text></View>
      ) : actioned === 'passed' ? (
        <View style={s.actionedBadge}><Text style={s.actionedText}>Passed</Text></View>
      ) : (
        <View style={s.cardActions}>
          <Pressable style={s.passBtn} onPress={() => { hTap(); setActioned('passed'); onPass(req.id) }}>
            <X size={18} color={Colors.inkPrimary} strokeWidth={2.2} />
            <Text style={s.passText}>Pass</Text>
          </Pressable>
          <Pressable style={s.acceptBtn} onPress={() => { hSuccess(); setActioned('pending'); onBeginAccept(req.id, req.name) }}>
            <Flame size={17} color={Colors.background} fill={Colors.background} />
            <Text style={s.acceptText}>Vibe back</Text>
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
      snapPoints={['92%']}
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
            <View style={{ gap: 12 }}>
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
          ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 28, letterSpacing: -0.7, color: Colors.inkPrimary },
  countBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.inkPrimary, alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.background },
  card: { gap: 12 },
  skCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: Colors.surfaceMuted, padding: 14, gap: 12 },
  cardActioned: { opacity: 0.5 },
  cardAvatar: { width: 52, height: 52, borderRadius: 26 },
  cardInfo: { flex: 1 },
  photo: { width: '100%', aspectRatio: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  photoInit: { fontFamily: FontFamily.displayExtraBold, fontSize: 72, color: Colors.inkDisabled },
  photoInfo: { position: 'absolute', left: 16, right: 16, bottom: 14 },
  photoName: { fontFamily: FontFamily.displayExtraBold, fontSize: 28, letterSpacing: -0.6, color: Colors.white },
  photoCity: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: withOpacity(Colors.white, 0.85) },
  bubble: { alignSelf: 'flex-start', maxWidth: '92%', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 18, borderTopLeftRadius: 6, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  bubbleText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkPrimary },
  cardActions: { flexDirection: 'row', gap: 10 },
  passBtn: { flex: 1, height: 50, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  passText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  acceptBtn: { flex: 1.6, height: 50, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.inkPrimary },
  acceptText: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.background },
  actionedBadge: { height: 50, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  actionedText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkSecondary },
  emptyBox: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center' },
})
