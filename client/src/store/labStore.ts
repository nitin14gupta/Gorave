import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Design lab: which variant (A or B) each screen under redesign is showing.
 * Flip it with <LabSwitch screen="…" /> (dev builds only). Once a screen's
 * winner is picked, its loser and its LabSwitch are deleted.
 */
export type LabVariant = 'a' | 'b'

interface LabStore {
  picks: Record<string, LabVariant>
  setPick: (screen: string, v: LabVariant) => void
}

export const useLabStore = create<LabStore>()(
  persist(
    (set) => ({
      picks: {},
      setPick: (screen, v) => set(s => ({ picks: { ...s.picks, [screen]: v } })),
    }),
    { name: 'gorave-design-lab', storage: createJSONStorage(() => AsyncStorage) },
  ),
)

export const useLabVariant = (screen: string): LabVariant => useLabStore(s => s.picks[screen] ?? 'a')
