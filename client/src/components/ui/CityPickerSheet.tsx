import { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { BottomSheetModal, BottomSheetFlatList, BottomSheetTextInput, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Check, Search } from 'lucide-react-native'
import { hSelection } from '@/lib/haptics'
import { Colors, FontFamily, Radius, Spacing, withOpacity } from '@/constants'
import { useCities, type CityResponse } from '@/hooks/useCities'

const SNAP_POINTS = ['70%']

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
  bg: { backgroundColor: Colors.surface },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.2) },
  header: { paddingHorizontal: Spacing.screenPadding, paddingVertical: 12 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
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
