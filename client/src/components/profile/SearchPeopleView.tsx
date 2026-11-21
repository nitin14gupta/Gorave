import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Search, X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import type { DiscoverUser } from '@/api/apiService'
import { NameWithTick } from '@/components/profile/VerifiedTick'

export interface RecentPerson { id: string; name: string | null; username: string | null; avatar: string | null }

export interface SearchViewProps {
  query: string
  onQuery: (q: string) => void
  onSubmit: () => void
  loading: boolean
  /** A search has run for the current query. */
  searched: boolean
  error: boolean
  results: DiscoverUser[]
  suggested: DiscoverUser[]
  suggestedLoading: boolean
  recent: RecentPerson[]
  onOpen: (u: DiscoverUser) => void
  onOpenRecent: (r: RecentPerson) => void
  onRemoveRecent: (id: string) => void
  onClearRecent: () => void
  onBack: () => void
}

export const whoLine = (u: DiscoverUser) => [u.age ? String(u.age) : null, u.city].filter(Boolean).join(' · ')

/**
 * Search people, Instagram style. A search pill up top; before you type, the people
 * you opened recently sit as a row of faces, then suggestions as plain
 * rows. Results are the same clean rows.
 */
export function SearchPeopleView(p: SearchViewProps) {
  const insets = useSafeAreaInsets()
  const typing = p.query.trim().length > 0

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <Pressable style={s.iconBtn} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <View style={s.search}>
          <Search size={16} color={Colors.inkDisabled} strokeWidth={2} />
          <TextInput
            style={s.input}
            value={p.query}
            onChangeText={p.onQuery}
            onSubmitEditing={p.onSubmit}
            placeholder="Search name or @username"
            placeholderTextColor={Colors.inkDisabled}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            autoFocus
          />
          {typing ? (
            <Pressable onPress={() => p.onQuery('')} hitSlop={8}><X size={16} color={Colors.inkSecondary} strokeWidth={2} /></Pressable>
          ) : null}
        </View>
      </View>

      {typing ? (
        p.loading ? <ActivityIndicator style={{ marginTop: 30 }} color={Colors.inkSecondary} /> :
        p.error ? <Empty title="Search didn't work" sub="Check your connection and try again." /> :
        p.searched && !p.results.length ? <Empty title="Nobody by that name" sub="Try their @username instead." /> : (
          <FlatList data={p.results} keyExtractor={u => u.id} keyboardShouldPersistTaps="handled" renderItem={({ item }) => <Row u={item} onPress={() => p.onOpen(item)} />} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} />
        )
      ) : (
        <FlatList
          data={p.suggested}
          keyExtractor={u => u.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListHeaderComponent={
            <View>
              {p.recent.length ? (
                <>
                  <View style={s.sectionRow}>
                    <Text style={s.section}>Recent</Text>
                    <Pressable onPress={p.onClearRecent} hitSlop={6}><Text style={s.clear}>Clear</Text></Pressable>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recent}>
                    {p.recent.map(r => (
                      <Pressable key={r.id} style={s.face} onPress={() => p.onOpenRecent(r)}>
                        <View style={s.faceImg}>{r.avatar ? <Image source={{ uri: r.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Text style={s.initial}>{(r.name ?? '?').charAt(0)}</Text>}</View>
                        <Text style={s.faceName} numberOfLines={1}>{(r.name ?? r.username ?? '').split(' ')[0]}</Text>
                        <Pressable style={s.faceX} onPress={() => p.onRemoveRecent(r.id)} hitSlop={8} accessibilityLabel={`Remove ${(r.name ?? 'them').split(' ')[0]} from recent`}><X size={10} color={Colors.inkPrimary} strokeWidth={3} /></Pressable>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : null}
              <Text style={[s.section, { paddingHorizontal: 20, marginTop: 18, marginBottom: 4 }]}>Suggested for you</Text>
              {p.suggestedLoading ? <ActivityIndicator style={{ marginTop: 20 }} color={Colors.inkSecondary} /> : null}
            </View>
          }
          renderItem={({ item }) => <Row u={item} onPress={() => p.onOpen(item)} />}
        />
      )}
    </View>
  )
}

/** One reason this person is here, or nothing. is_mutual means they follow you. */
function reason(u: DiscoverUser): string | null {
  if (u.is_mutual && u.is_following) return 'Friends'
  if (u.is_mutual) return 'Follows you'
  if (u.has_connection) return "You've chatted"
  return null
}

// Two lines, like Instagram: the name, then @username and one reason.
function Row({ u, onPress }: { u: DiscoverUser; onPress: () => void }) {
  const why = reason(u)
  return (
    <Pressable style={s.row} onPress={onPress}>
      <View style={s.avatar}>{u.photos[0]?.url ? <Image source={{ uri: u.photos[0].url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Text style={s.initial}>{(u.name ?? '?').charAt(0)}</Text>}</View>
      <View style={s.rowText}>
        <NameWithTick name={u.name ?? u.username ?? ''} verified={u.is_verified} style={s.name} />
        <Text style={s.sub} numberOfLines={1}>
          {u.username ? `@${u.username}` : ''}
          {why ? <Text style={s.why}>{u.username ? ' · ' : ''}{why}</Text> : null}
        </Text>
      </View>
    </Pressable>
  )
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{sub}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: Colors.surface },
  input: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, padding: 0 },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20, marginTop: 12, marginBottom: 12 },
  section: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  clear: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary },
  // Room above the faces so the remove dot is never clipped by the scroller.
  recent: { gap: 16, paddingHorizontal: 20, paddingTop: 4 },
  face: { width: 64, alignItems: 'center', gap: 6 },
  faceImg: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  faceName: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkPrimary },
  faceX: { position: 'absolute', top: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.elevated, borderWidth: 2, borderColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 8 },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  why: { fontFamily: FontFamily.bodyMedium, color: withOpacity(Colors.inkPrimary, 0.75) },

  empty: { alignItems: 'center', marginTop: 60, gap: 6, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
})
