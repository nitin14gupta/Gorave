import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { EmergencyContact } from '@/types/api'

// Emergency contacts live here (not local screen state) so the Safety Hub
// can show an up-to-date count/preview without re-fetching every time it's
// opened — same reasoning as hotlistStore.
//
// Kept on the phone too: SOS must still know who to reach when the network is
// bad, and a failed load must never look like "you have no contacts".
// `loaded` (the server confirmed the list this session) isn't saved, so the
// app only says "add a contact first" when the server said there are none.
// Cleared on logout (store/auth.ts).
interface SafetyState {
  contacts: EmergencyContact[]
  loaded: boolean
  setContacts: (contacts: EmergencyContact[]) => void
  addContact: (contact: EmergencyContact) => void
  removeContact: (id: string) => void
  reset: () => void
}

export const useSafetyStore = create<SafetyState>()(
  persist(
    (set) => ({
      contacts: [],
      loaded: false,
      setContacts: (contacts) => set({ contacts, loaded: true }),
      addContact: (contact) => set(state => ({ contacts: [...state.contacts, contact] })),
      removeContact: (id) => set(state => ({ contacts: state.contacts.filter(c => c.id !== id) })),
      reset: () => set({ contacts: [], loaded: false }),
    }),
    {
      name: 'vibe-safety-contacts',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ contacts: s.contacts }),
    },
  ),
)
