import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { ArrowLeft, Check, Flame, MessageCircle } from 'lucide-react-native'
import ApiService from '@/api/apiService'
import { AppHeader, HeaderIconBtn, BrandedLoader, VibeRequestModal } from '@/components/ui'
import { NameWithTick } from '@/components/profile/VerifiedTick'
import { Colors, FontFamily } from '@/constants'
import { usePillStore } from '@/store/pillStore'
import { useVibeStore } from '@/store/vibeStore'
import { hSuccess, hTap } from '@/lib/haptics'

interface Person {
  id: string
  name: string | null
  username: string | null
  avatar: string | null
  is_verified: boolean
  is_host: boolean
  checked_in: boolean
  is_following: boolean
  vibe_status: string | null
  connected: boolean
}

/**
 * People from last night: the morning after, everyone who was there, so you
 * can send a vibe to someone you clicked with. Turning a night into friends.
 */
export default function PeopleFromNightScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)
  const { markSent, isSentTo } = useVibeStore()
  const [data, setData] = useState<{ title: string; cover: string | null; people: Person[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [vibeFor, setVibeFor] = useState<Person | null>(null)

  useFocusEffect(useCallback(() => {
    if (!id) return
    ApiService.get<{ title: string; cover: string | null; people: Person[] }>(`/events/${id}/people`)
      .then(setData)
      .catch((e: any) => setError(e?.message || "Couldn't load who was there"))
  }, [id]))

  const sendVibe = async (message: string) => {
    const p = vibeFor
    setVibeFor(null)
    if (!p) return
    markSent(p.id)
    try {
      await ApiService.sendVibe(p.id, message)
      hSuccess()
      showPill(`Vibe sent to ${(p.name ?? 'them').split(' ')[0]}`, 'default')
    } catch (e: any) {
      showPill(e?.message || "Couldn't send that vibe", 'error')
    }
  }

  const header = (
    <AppHeader
      title="People from last night"
      leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
    />
  )

  if (!data) {
    return (
      <View style={s.root}>
        {header}
        <View style={s.center}>{error ? <Text style={s.empty}>{error}</Text> : <BrandedLoader />}</View>
      </View>
    )
  }

  return (
    <View style={s.root}>
      {header}
      <FlatList
        data={data.people}
        keyExtractor={p => p.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        ListHeaderComponent={
          <View style={s.top}>
            {data.cover ? <Image source={{ uri: data.cover }} style={s.cover} contentFit="cover" /> : null}
            <View style={{ flex: 1 }}>
              <Text style={s.event} numberOfLines={2}>{data.title}</Text>
              <Text style={s.count}>{data.people.length} {data.people.length === 1 ? 'person' : 'people'} were there. Send a vibe to someone you clicked with.</Text>
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={s.divider} />}
        renderItem={({ item: p }) => {
          const sent = p.vibe_status === 'pending' || isSentTo(p.id)
          return (
            <Pressable style={s.row} onPress={() => { hTap(); router.push(`/(profile)/${p.id}` as any) }}>
              <View style={s.avatar}>
                {p.avatar ? <Image source={{ uri: p.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Text style={s.initial}>{(p.name ?? '?').charAt(0)}</Text>}
              </View>
              <View style={s.mid}>
                <NameWithTick name={p.name ?? p.username ?? 'Guest'} verified={p.is_verified} style={s.name} />
                <Text style={s.sub} numberOfLines={1}>{p.is_host ? 'Host' : p.checked_in ? 'Was there' : 'Had a ticket'}{p.username ? ` · @${p.username}` : ''}</Text>
              </View>
              {p.connected ? (
                <View style={s.state}><MessageCircle size={14} color={Colors.inkSecondary} strokeWidth={2} /><Text style={s.stateText}>Chatting</Text></View>
              ) : sent ? (
                <View style={s.state}><Check size={14} color={Colors.inkSecondary} strokeWidth={2.4} /><Text style={s.stateText}>Vibe sent</Text></View>
              ) : (
                <Pressable style={s.vibeBtn} onPress={() => { hTap(); setVibeFor(p) }} hitSlop={4} accessibilityLabel={`Send a vibe to ${(p.name ?? 'them').split(' ')[0]}`}>
                  <Flame size={14} color={Colors.background} fill={Colors.background} />
                  <Text style={s.vibeText}>Vibe</Text>
                </Pressable>
              )}
            </Pressable>
          )
        }}
      />
      <VibeRequestModal
        visible={!!vibeFor}
        user={vibeFor ? {
          id: vibeFor.id, name: vibeFor.name, username: vibeFor.username, gender: null, age: 0, bio: null, city: null,
          interests: [], voice_url: null, distance_km: null, match_pct: 0,
          photos: vibeFor.avatar ? [{ id: vibeFor.id, url: vibeFor.avatar, position: 0 }] : [],
        } as any : null}
        onSend={sendVibe}
        onClose={() => setVibeFor(null)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  empty: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 18 },
  cover: { width: 56, height: 70, borderRadius: 12 },
  event: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  count: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  mid: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  vibeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 14, borderRadius: 999, backgroundColor: Colors.inkPrimary },
  vibeText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.background },
  state: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stateText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginLeft: 84 },
})
