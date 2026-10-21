import { ActivityIndicator, Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import type { DiscoverUser } from '@/api/apiService'
import { whoLine, type SearchViewProps } from './types'

const W = Dimensions.get('window').width
const CELL = Math.floor((W - 32 - 10) / 2)

/**
 * B · Find people. A big title and search, recent people as small pills,
 * then suggestions as square photo cards two a row, each with what you
 * share. Typing swaps the grid for a list of matches.
 */
export function SearchB(p: SearchViewProps) {
  const insets = useSafeAreaInsets()
  const typing = p.query.trim().length > 0

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.head}>
        <View style={s.headRow}>
          <Text style={s.title}>Find people</Text>
          <Pressable style={s.close} onPress={p.onBack} hitSlop={8}>
            <X size={18} color={Colors.inkPrimary} strokeWidth={2} />
          </Pressable>
        </View>
        <View style={s.search}>
          <Search size={17} color={Colors.inkDisabled} strokeWidth={2} />
          <TextInput
            style={s.input}
            value={p.query}
            onChangeText={p.onQuery}
            onSubmitEditing={p.onSubmit}
            placeholder="Name or @username"
            placeholderTextColor={Colors.inkDisabled}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {typing ? <Pressable onPress={() => p.onQuery('')} hitSlop={8}><X size={16} color={Colors.inkSecondary} strokeWidth={2} /></Pressable> : null}
        </View>
      </View>

      {typing ? (
        p.loading ? <ActivityIndicator style={{ marginTop: 30 }} color={Colors.inkSecondary} /> :
        p.error ? <Text style={s.note}>Search didn&apos;t work. Check your connection.</Text> :
        p.searched && !p.results.length ? <Text style={s.note}>Nobody by that name. Try their @username.</Text> : (
          <FlatList
            data={p.results}
            keyExtractor={u => u.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            renderItem={({ item }) => (
              <Pressable style={s.row} onPress={() => p.onOpen(item)}>
                <View style={s.rowImg}>{item.photos[0]?.url ? <Image source={{ uri: item.photos[0].url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : null}</View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowName} numberOfLines={1}>{item.name ?? item.username}</Text>
                  <Text style={s.rowSub} numberOfLines={1}>{[item.username ? `@${item.username}` : null, whoLine(item)].filter(Boolean).join(' · ')}</Text>
                </View>
              </Pressable>
            )}
          />
        )
      ) : (
        <FlatList
          data={p.suggested}
          keyExtractor={u => u.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 10 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, gap: 14 }}
          ListHeaderComponent={
            <View>
              {p.recent.length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pills} style={{ marginHorizontal: -16 }}>
                  {p.recent.map(r => (
                    <Pressable key={r.id} style={s.pill} onPress={() => p.onOpenRecent(r)}>
                      <View style={s.pillImg}>{r.avatar ? <Image source={{ uri: r.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : null}</View>
                      <Text style={s.pillName} numberOfLines={1}>{(r.name ?? r.username ?? '').split(' ')[0]}</Text>
                      <Pressable onPress={() => p.onRemoveRecent(r.id)} hitSlop={8}><X size={13} color={Colors.inkSecondary} strokeWidth={2.4} /></Pressable>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
              <Text style={s.section}>People you might like</Text>
              {p.suggestedLoading ? <ActivityIndicator style={{ marginTop: 20 }} color={Colors.inkSecondary} /> : null}
            </View>
          }
          renderItem={({ item }) => <Card u={item} onPress={() => p.onOpen(item)} />}
        />
      )}
    </View>
  )
}

function Card({ u, onPress }: { u: DiscoverUser; onPress: () => void }) {
  const shared = u.is_mutual ? 'Follow each other' : u.has_connection ? 'Friends in common' : u.interests[0] ?? null
  return (
    <Pressable style={{ width: CELL }} onPress={onPress}>
      <View style={s.photo}>
        {u.photos[0]?.url ? <Image source={{ uri: u.photos[0].url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : null}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={s.shade} />
        <View style={s.photoText}>
          <Text style={s.cardName} numberOfLines={1}>{(u.name ?? u.username ?? '').split(' ')[0]}{u.age ? `, ${u.age}` : ''}</Text>
          {u.city ? <Text style={s.cardCity} numberOfLines={1}>{u.city}</Text> : null}
        </View>
      </View>
      {shared ? <Text style={s.shared} numberOfLines={1}>{shared}</Text> : null}
    </Pressable>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  head: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, gap: 14 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 32, letterSpacing: -0.8, color: Colors.inkPrimary },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingHorizontal: 16, borderRadius: 999, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  input: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, padding: 0 },

  pills: { gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4, paddingRight: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  pillImg: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.surfaceMuted },
  pillName: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary, maxWidth: 90 },
  section: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary, marginTop: 14, marginBottom: 2 },

  photo: { width: CELL, height: CELL, borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.surfaceMuted },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
  photoText: { position: 'absolute', left: 12, right: 12, bottom: 10 },
  cardName: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.white },
  cardCity: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: withOpacity(Colors.white, 0.8) },
  shared: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary, marginTop: 6, paddingHorizontal: 2 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10 },
  rowImg: { width: 52, height: 52, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.surfaceMuted },
  rowName: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  rowSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  note: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', marginTop: 40, paddingHorizontal: 32 },
})
