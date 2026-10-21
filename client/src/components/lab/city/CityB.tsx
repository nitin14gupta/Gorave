import { Dimensions, FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, LocateFixed, Search, X } from 'lucide-react-native'
import { CITY_PHOTOS, Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from '@/components/ui'
import { hSelection, hTap } from '@/lib/haptics'
import type { CityOption, CityViewProps } from './types'

const W = Dimensions.get('window').width
const BANNER_H = Math.round((W - 32) * 0.36)

/**
 * B · Postcards. Every city with a photo is a wide postcard banner you
 * scroll through, the selected one marked; cities without a photo follow as
 * a compact list. Search sits fixed at the top like a travel app.
 */
export function CityB(p: CityViewProps) {
  const insets = useSafeAreaInsets()
  const withPhoto = p.cities.filter(c => CITY_PHOTOS[c.name])
  const rest = p.cities.filter(c => !CITY_PHOTOS[c.name])
  const data: (CityOption & { photo: boolean })[] = [...withPhoto.map(c => ({ ...c, photo: true })), ...rest.map(c => ({ ...c, photo: false }))]

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.head}>
        <View style={s.headRow}>
          <Text style={s.title}>Where are you?</Text>
          <Pressable style={s.close} onPress={p.onBack} hitSlop={8}>
            <X size={18} color={Colors.inkPrimary} strokeWidth={2} />
          </Pressable>
        </View>
        <View style={s.search}>
          <Search size={16} color={Colors.inkDisabled} strokeWidth={2} />
          <TextInput style={s.input} value={p.query} onChangeText={p.onQuery} placeholder="Search a city" placeholderTextColor={Colors.inkDisabled} />
          <Pressable style={s.locate} onPress={() => { hTap(); p.onDetect() }} hitSlop={6}>
            <LocateFixed size={16} color={Colors.inkPrimary} strokeWidth={2} />
            <Text style={s.locateText}>{p.detecting ? 'Finding…' : 'Near me'}</Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={data}
          keyExtractor={c => c.name}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 }}
          renderItem={({ item, index }) => {
            const on = p.selected === item.name
            if (item.photo) {
              return (
                <Pressable style={[s.banner, on && s.bannerOn]} onPress={() => { hSelection(); p.onSelect(item.name) }}>
                  <Image source={CITY_PHOTOS[item.name]} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 0 }} style={StyleSheet.absoluteFill} />
                  <View style={s.bannerText}>
                    <Text style={s.bannerName}>{item.name}</Text>
                    <Text style={s.bannerState}>{item.state}</Text>
                  </View>
                  {on ? <View style={s.tick}><Check size={15} color={Colors.nearBlack} strokeWidth={3} /></View> : null}
                </Pressable>
              )
            }
            const first = index === withPhoto.length
            return (
              <>
                {first ? <Text style={s.section}>Other cities</Text> : null}
                <Pressable style={s.row} onPress={() => { hSelection(); p.onSelect(item.name) }}>
                  <View style={[s.radio, on && s.radioOn]}>{on ? <View style={s.radioDot} /> : null}</View>
                  <Text style={s.rowName}>{item.name}</Text>
                  <Text style={s.rowState}>{item.state}</Text>
                </Pressable>
              </>
            )
          }}
        />
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <PrimaryButton label={p.selected ? `Set ${p.selected}` : 'Pick a city'} onPress={p.onSave} disabled={!p.selected} loading={p.saving} />
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  head: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 14 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, letterSpacing: -0.7, color: Colors.inkPrimary },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 50, paddingLeft: 14, paddingRight: 6, borderRadius: 999, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  input: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, padding: 0 },
  locate: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 38, borderRadius: 999, backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  locateText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary },

  banner: { height: BANNER_H, borderRadius: 20, overflow: 'hidden', marginBottom: 12, backgroundColor: Colors.surface, borderWidth: 2, borderColor: 'transparent' },
  bannerOn: { borderColor: Colors.white },
  bannerText: { position: 'absolute', left: 18, top: 0, bottom: 0, justifyContent: 'center' },
  bannerName: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, letterSpacing: -0.6, color: Colors.white },
  bannerState: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: withOpacity(Colors.white, 0.8) },
  tick: { position: 'absolute', top: 12, right: 12, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },

  section: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: Colors.inkDisabled, marginTop: 14, marginBottom: 4, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: withOpacity(Colors.inkPrimary, 0.3), alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: Colors.inkPrimary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.inkPrimary },
  rowName: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  rowState: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },

  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
})
