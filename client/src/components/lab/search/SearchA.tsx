import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Search, X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import type { DiscoverUser } from '@/api/apiService'
import { whoLine, type SearchViewProps } from './types'

/**
 * A · Instagram search. A search pill up top; before you type, the people
 * you opened recently sit as a row of faces, then suggestions as plain
 * rows. Results are the same clean rows.
 */
export function SearchA(p: SearchViewProps) {
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
                        <Pressable style={s.faceX} onPress={() => p.onRemoveRecent(r.id)} hitSlop={6}><X size={10} color={Colors.nearBlack} strokeWidth={3} /></Pressable>
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

function Row({ u, onPress }: { u: DiscoverUser; onPress: () => void }) {
  const tag = u.is_mutual ? 'You follow each other' : u.has_connection ? 'Friends in common' : u.same_city ? 'In your city' : null
  return (
    <Pressable style={s.row} onPress={onPress}>
      <View style={s.avatar}>{u.photos[0]?.url ? <Image source={{ uri: u.photos[0].url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Text style={s.initial}>{(u.name ?? '?').charAt(0)}</Text>}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>{u.name ?? u.username}</Text>
        <Text style={s.sub} numberOfLines={1}>{[u.username ? `@${u.username}` : null, whoLine(u)].filter(Boolean).join(' · ')}</Text>
        {tag ? <Text style={s.tag}>{tag}</Text> : null}
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
  recent: { gap: 16, paddingHorizontal: 20 },
  face: { width: 64, alignItems: 'center', gap: 6 },
  faceImg: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  faceName: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkPrimary },
  faceX: { position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  tag: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: withOpacity(Colors.inkPrimary, 0.7), marginTop: 3 },

  empty: { alignItems: 'center', marginTop: 60, gap: 6, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
})
