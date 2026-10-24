import { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react'
import { Dimensions, View, Text, StyleSheet, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { CITY_PHOTOS, FEATURED_CITIES } from '@/constants/cityPhotos'
import { BottomSheetModal, BottomSheetFlatList, BottomSheetTextInput, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Check, Search } from 'lucide-react-native'
import { hSelection } from '@/lib/haptics'
import { Colors, FontFamily, Radius, Spacing, withOpacity } from '@/constants'
import { useCities, type CityResponse } from '@/hooks/useCities'

const SNAP_POINTS = ['88%']
const TILE_W = (Dimensions.get('window').width - Spacing.screenPadding * 2 - 10) / 2

interface Props {
  visible: boolean
  title?: string
  /** Name of the currently selected city */
  selected: string | null
  onSelect: (city: CityResponse) => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

const CityRow = memo(function CityRow({ city, selected, onPress }: {
  city: CityResponse
  selected: boolean
  onPress: (city: CityResponse) => void
}) {
  const handlePress = useCallback(() => onPress(city), [onPress, city])
  return (
    <Pressable style={s.cityRow} onPress={handlePress} android_ripple={{ color: withOpacity(Colors.inkPrimary, 0.06) }}>
      <View>
        <Text style={s.cityName}>{city.name}</Text>
        <Text style={s.cityState}>{city.state}</Text>
      </View>
      {selected && <Check size={18} color={Colors.inkPrimary} strokeWidth={2.5} />}
    </Pressable>
  )
})

function CityPickerSheetCore({ title = 'Choose city', selected, onSelect, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const { cities } = useCities()

  useEffect(() => { sheetRef.current?.present() }, [])

  const pick = useCallback((city: CityResponse) => {
    hSelection()
    onSelect(city)
    sheetRef.current?.dismiss()
  }, [onSelect])

  // The cities we have photos for, as postcards above the full list.
  const featured = useMemo(() => cities.filter(c => FEATURED_CITIES.includes(c.name)), [cities])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return cities
    return cities.filter(c => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q))
  }, [cities, query])

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      <View style={s.header}>
        <Text style={s.title}>{title}</Text>
      </View>
      <View style={[s.searchWrap, focused && s.searchWrapFocused]}>
        <Search size={16} color={Colors.inkSecondary} strokeWidth={2} />
        <BottomSheetTextInput
          placeholder="Search cities…"
          placeholderTextColor={Colors.inkDisabled}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={s.searchInput}
        />
      </View>
      <BottomSheetFlatList
        data={filtered}
        keyExtractor={(c: CityResponse) => c.name}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.cityList}
        ListHeaderComponent={
          query.trim() ? null : (
            <View style={{ gap: 12, marginBottom: 8 }}>
              <Text style={s.label}>POPULAR</Text>
              <View style={s.tiles}>
                {featured.map(c => {
                  const on = selected === c.name
                  return (
                    <Pressable key={c.name} style={[s.tile, on && s.tileOn]} onPress={() => pick(c)}>
                      <Image source={CITY_PHOTOS[c.name]} style={StyleSheet.absoluteFill} contentFit="cover" />
                      <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill} />
                      <Text style={s.tileName}>{c.name}</Text>
                      {on ? <View style={s.tileCheck}><Check size={13} color={Colors.nearBlack} strokeWidth={3} /></View> : null}
                    </Pressable>
                  )
                })}
              </View>
              <Text style={[s.label, { marginTop: 8 }]}>ALL CITIES</Text>
            </View>
          )
        }
        renderItem={({ item }: { item: CityResponse }) => (
          <CityRow city={item} selected={selected === item.name} onPress={pick} />
        )}
      />
    </BottomSheetModal>
  )
}

export function CityPickerSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <CityPickerSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface, borderRadius: 28 },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: TILE_W, height: TILE_W * 0.72, borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, justifyContent: 'flex-end', padding: 12, borderWidth: 2, borderColor: 'transparent' },
  tileOn: { borderColor: Colors.inkPrimary },
  tileName: { fontFamily: FontFamily.displayExtraBold, fontSize: 18, letterSpacing: -0.3, color: Colors.white },
  tileCheck: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.2) },
  header: { paddingHorizontal: Spacing.screenPadding, paddingVertical: 12 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, letterSpacing: -0.6, color: Colors.inkPrimary },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: Spacing.screenPadding, marginBottom: 10,
    height: 46, borderRadius: Radius.input, backgroundColor: Colors.elevated,
    borderWidth: 1.5, borderColor: 'transparent',
    paddingHorizontal: 14,
  },
  searchWrapFocused: { borderColor: Colors.inkSecondary },
  searchInput: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, padding: 0 },
  cityList: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 24 },
  cityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
  },
  cityName: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary, marginBottom: 2 },
  cityState: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
})
