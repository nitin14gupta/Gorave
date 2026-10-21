import { Dimensions, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Check, LocateFixed, Search } from 'lucide-react-native'
import { CITY_PHOTOS, Colors, FEATURED_CITIES, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from '@/components/ui'
import { hSelection, hTap } from '@/lib/haptics'
import type { CityViewProps } from './types'

const W = Dimensions.get('window').width
const CARD = Math.floor((W - 40 - 12) / 2)

/**
 * A · City cards. The cities Gorave is busiest in as photo cards, two a
 * row, with the website's own city shots. Every other city sits in a plain
 * list under them. Search narrows both.
 */
export function CityA(p: CityViewProps) {
  const insets = useSafeAreaInsets()
  // Only cities the server knows (the list is already narrowed by search).
  const featured = FEATURED_CITIES.filter(n => p.cities.some(c => c.name === n))
  const others = p.cities.filter(c => !CITY_PHOTOS[c.name])

  const header = (
    <View>
      <Text style={s.big}>Your city</Text>
      <Text style={s.lede}>We show you events and people here.</Text>

      <View style={s.search}>
        <Search size={16} color={Colors.inkDisabled} strokeWidth={2} />
        <TextInput style={s.input} value={p.query} onChangeText={p.onQuery} placeholder="Search cities" placeholderTextColor={Colors.inkDisabled} />
      </View>

      <Pressable style={s.detect} onPress={() => { hTap(); p.onDetect() }}>
        <LocateFixed size={18} color={Colors.inkPrimary} strokeWidth={2} />
        <Text style={s.detectText}>{p.detecting ? 'Finding you…' : 'Use where I am now'}</Text>
      </Pressable>

      {featured.length ? (
        <View style={s.grid}>
          {featured.map(name => {
            const on = p.selected === name
            return (
              <Pressable key={name} style={[s.card, on && s.cardOn]} onPress={() => { hSelection(); p.onSelect(name) }}>
                <Image source={CITY_PHOTOS[name]} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={s.shade} />
                <Text style={s.cardName}>{name}</Text>
                {on ? <View style={s.tick}><Check size={14} color={Colors.nearBlack} strokeWidth={3} /></View> : null}
              </Pressable>
            )
          })}
        </View>
      ) : null}
      {others.length ? <Text style={s.section}>More cities</Text> : null}
    </View>
  )

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <Pressable style={s.iconBtn} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={others}
          keyExtractor={c => c.name}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const on = p.selected === item.name
            return (
              <Pressable style={s.row} onPress={() => { hSelection(); p.onSelect(item.name) }}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowName, on && { fontFamily: FontFamily.bodySemiBold }]}>{item.name}</Text>
                  <Text style={s.rowState}>{item.state}</Text>
                </View>
                {on ? <Check size={20} color={Colors.inkPrimary} strokeWidth={2.6} /> : null}
              </Pressable>
            )
          }}
        />
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <PrimaryButton label={p.selected ? `Move to ${p.selected}` : 'Pick a city'} onPress={p.onSave} disabled={!p.selected} loading={p.saving} />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { paddingHorizontal: 12, paddingVertical: 6 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  big: { fontFamily: FontFamily.displayExtraBold, fontSize: 40, letterSpacing: -1, color: Colors.inkPrimary },
  lede: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, marginTop: 4, marginBottom: 16 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 14, borderRadius: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  input: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, padding: 0 },
  detect: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
  detectText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: CARD, height: Math.round(CARD * 0.78), borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.surface, borderWidth: 2, borderColor: 'transparent' },
  cardOn: { borderColor: Colors.white },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  cardName: { position: 'absolute', left: 12, bottom: 10, fontFamily: FontFamily.displayExtraBold, fontSize: 20, color: Colors.white },
  tick: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },

  section: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.inkDisabled, marginTop: 26, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  rowName: { fontFamily: FontFamily.bodyMedium, fontSize: 16, color: Colors.inkPrimary },
  rowState: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },

  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: withOpacity(Colors.inkPrimary, 0.08) },
})
