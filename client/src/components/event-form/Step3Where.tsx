import React, { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native'
import { ChevronDown, Lock, MapPin, Search } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { LocationPickerMap } from '@/components/maps'
import { CityPickerSheet } from '@/components/ui/CityPickerSheet'
import { useCities } from '@/hooks/useCities'
import { useLocationSearch, placeArea, placePincode, type PlaceResult } from '@/hooks/useLocationSearch'
import { LocationSearchModal } from './LocationSearchModal'
import type { CreateEventForm } from '@/hooks/useCreateEvent'
import { ef } from './styles'

interface Props {
  form: CreateEventForm
  set: <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  disabled?: boolean
  /**
   * When true the map fills a fixed-height block below the fields (edit
   * screen). When false (default) it's laid out as Step 3 of the wizard.
   */
  inline?: boolean
}

// Structured address, like Swiggy/Airbnb: city → building → street → area +
// pincode → exact pin. Hosts type the lines themselves; the map and search
// only ever fill area/pincode/pin, so dragging the pin never wipes what
// they typed.
export function Step3Where({ form, set, errors, setErrors, disabled, inline = false }: Props) {
  const [cityOpen, setCityOpen] = useState(false)
  const { cities } = useCities()
  const cityRow = useMemo(() => cities.find(c => c.name === form.city), [cities, form.city])
  const focus = cityRow && (cityRow.lat !== 0 || cityRow.lng !== 0) ? { lat: cityRow.lat, lng: cityRow.lng } : null
  const search = useLocationSearch(form.locationLat, form.locationLng, form.city || null)

  const clearError = (key: string) => setErrors(e => (e[key] ? { ...e, [key]: '' } : e))

  const onPickPlace = (item: PlaceResult) => {
    if (item.lat && item.lon) {
      set('locationLat', parseFloat(item.lat))
      set('locationLng', parseFloat(item.lon))
      clearError('pin')
    }
    const area = placeArea(item)
    const pin = placePincode(item)
    if (area) set('area', area)
    if (pin) set('pincode', pin)
    if (!form.addressLine2.trim() && item.address?.road) set('addressLine2', item.address.road)
    // "Use what I typed" row — nothing to geocode, treat it as the building line
    if (item.place_id === 'custom' && !form.addressLine1.trim()) set('addressLine1', item.display_name)
    search.setSearchOpen(false)
  }

  const field = (
    key: 'addressLine1' | 'addressLine2' | 'area' | 'pincode',
    label: string,
    placeholder: string,
    extra?: Partial<React.ComponentProps<typeof TextInput>>,
  ) => (
    <View style={[s.field, key === 'pincode' && s.pinField, key === 'area' && s.areaField]}>
      <Text style={ef.fieldLabel}>{label}</Text>
      <View style={[ef.inputWrap, errors[key] && ef.inputWrapError]}>
        <TextInput
          style={ef.textInput}
          value={form[key]}
          onChangeText={v => { set(key, v); clearError(key) }}
          placeholder={placeholder}
          placeholderTextColor={Colors.glassTextDisabled}
          editable={!disabled}
          {...extra}
        />
      </View>
      {errors[key] ? <Text style={ef.errorText}>{errors[key]}</Text> : null}
    </View>
  )

  const fields = (
    <>
      <Text style={ef.fieldLabel}>City *</Text>
      <Pressable
        style={[ef.inputWrap, errors.city && ef.inputWrapError]}
        onPress={() => { if (!disabled) setCityOpen(true) }}
      >
        <MapPin size={16} color={Colors.inkPrimary} style={{ marginRight: 8 }} />
        <Text style={[ef.textInput, { color: form.city ? Colors.inkPrimary : Colors.glassTextDisabled }]}>
          {form.city || 'Choose a city'}
        </Text>
        <ChevronDown size={18} color={Colors.inkSecondary} />
      </Pressable>
      {errors.city ? <Text style={ef.errorText}>{errors.city}</Text> : null}

      <Pressable
        style={s.searchRow}
        onPress={() => { if (!disabled) search.setSearchOpen(true) }}
      >
        <Search size={16} color={Colors.inkSecondary} />
        <Text style={s.searchText}>Search building, street or area{form.city ? ` in ${form.city}` : ''}</Text>
      </Pressable>

      {field('addressLine1', 'Flat, house or building *', 'e.g. Flat 1202, Palm Grove')}
      {field('addressLine2', 'Street & landmark', 'e.g. 16th Road, near Khar Gymkhana')}
      <View style={s.row}>
        {field('area', 'Area', 'e.g. Khar West')}
        {field('pincode', 'Pincode', '400052', { keyboardType: 'number-pad', maxLength: 6 })}
      </View>

      <View style={s.noteRow}>
        <Lock size={12} color={Colors.inkSecondary} strokeWidth={2} />
        <Text style={ef.locationNote}>Only confirmed guests see the full address — everyone else sees the area</Text>
      </View>
      <Text style={ef.fieldLabel}>Drag the map so the pin sits on the entrance</Text>
      {errors.pin ? <Text style={[ef.errorText, s.pinError]}>{errors.pin}</Text> : null}
    </>
  )

  const mapBlock = (
    <View style={inline ? s.mapInline : ef.mapWrap}>
      <LocationPickerMap
        lat={form.locationLat ?? undefined}
        lng={form.locationLng ?? undefined}
        focus={focus}
        onChange={(lat, lng) => { set('locationLat', lat); set('locationLng', lng); clearError('pin') }}
        onAddressDetected={({ area, pincode }) => {
          // Only fill blanks — never overwrite what the host typed.
          if (area && !form.area.trim()) set('area', area)
          if (pincode && !form.pincode.trim()) set('pincode', pincode)
        }}
      />
      <View style={ef.mapCentrePin} pointerEvents="none">
        <MapPin size={36} color={Colors.brandOrange} fill={withOpacity(Colors.brandOrange, 0.25)} />
      </View>
    </View>
  )

  const overlays = (
    <>
      <LocationSearchModal
        visible={search.searchOpen}
        onClose={() => search.setSearchOpen(false)}
        query={search.query}
        setQuery={search.setQuery}
        results={search.results}
        loading={search.loading}
        onSelect={onPickPlace}
      />
      <CityPickerSheet
        visible={cityOpen}
        title="Which city is it in?"
        selected={form.city || null}
        onSelect={c => {
          if (c.name !== form.city) {
            set('city', c.name)
            // Area/pincode belong to the old city
            set('area', '')
            set('pincode', '')
          }
          clearError('city')
        }}
        onClose={() => setCityOpen(false)}
      />
    </>
  )

  if (inline) {
    return (
      <View>
        {fields}
        {mapBlock}
        {overlays}
      </View>
    )
  }

  return (
    <View style={ef.step3Container}>
      <ScrollView style={ef.stepScroll} contentContainerStyle={ef.stepContent} keyboardShouldPersistTaps="handled">
        <Text style={ef.stepTitle}>Where&apos;s the VIBE?</Text>
        <Text style={ef.stepSub}>Guests get the exact address once they&apos;re in</Text>
        {fields}
        {mapBlock}
      </ScrollView>
      {overlays}
    </View>
  )
}

const s = StyleSheet.create({
  field: { marginTop: 14 },
  row: { flexDirection: 'row', gap: 10 },
  areaField: { flex: 1.6 },
  pinField: { flex: 1 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 12, paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.glassBorder,
  },
  searchText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary, flex: 1 },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 14 },
  pinError: { marginTop: -4, marginBottom: 8 },
  mapInline: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
})
