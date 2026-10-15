import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// The city the Events tab is browsing. null = follow the user's home city
// (useHomeCity) — only set once they explicitly pick another one, so a later
// "Change City" on their profile still moves the feed with it.
interface CityFilterStore {
  city: string | null
  setCity: (city: string | null) => void
}

export const useCityFilterStore = create<CityFilterStore>()(
  persist(
    (set) => ({
      city: null,
      setCity: (city) => set({ city }),
    }),
    { name: 'vibe-city-filter', storage: createJSONStorage(() => AsyncStorage) }
  )
)
