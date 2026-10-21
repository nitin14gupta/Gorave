import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { hSuccess } from '@/lib/haptics'
import { CityPickerView } from '@/components/profile/CityPickerView'
import { useLocation } from '@/hooks/useLocation'
import { setLocation } from '@/api/user'
import { useOnboardingStore } from '@/store/onboarding'
import { usePillStore } from '@/store/pillStore'
import { Colors } from '@/constants'

export default function ProfileLocationScreen() {
  const { filtered, query, setQuery, selectedCity, detecting, selectCity, detectLocation } = useLocation()
  const store = useOnboardingStore()
  const showPill = usePillStore(s => s.show)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!selectedCity) return
    setSaving(true)
    try {
      await setLocation(selectedCity, store.lat ?? 0, store.lng ?? 0)
      router.back()
    } catch (e: any) {
      showPill(e?.message || 'Could not save your location', 'error')
      setSaving(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <CityPickerView
        cities={filtered}
        query={query}
        onQuery={setQuery}
        selected={selectedCity}
        onSelect={selectCity}
        detecting={detecting}
        onDetect={detectLocation}
        saving={saving}
        onSave={() => { hSuccess(); handleSave() }}
        onBack={() => router.back()}
      />
    </View>
  )
}
