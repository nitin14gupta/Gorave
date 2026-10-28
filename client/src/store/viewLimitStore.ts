import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ViewLimit } from '@/hooks/useMediaPicker'

interface ViewLimitStore {
  /** The last choice you sent photos with; the next send starts on it (like Instagram). */
  last: ViewLimit
  setLast: (limit: ViewLimit) => void
}

export const useViewLimitStore = create<ViewLimitStore>()(
  persist(
    (set) => ({
      last: null,
      setLast: (last) => set({ last }),
    }),
    { name: 'gorave-chat-view-limit', storage: createJSONStorage(() => AsyncStorage) }
  )
)
