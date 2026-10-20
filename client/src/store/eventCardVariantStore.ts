import { Dimensions } from 'react-native'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Which EventCard design is showing while we pick one for 4:5 photos.
 * A = poster (everything on the photo, two per row in lists).
 * B = ticket row (photo on the left, details on the right).
 * Flip it with EventCardVariantSwitch (dev builds only).
 */
export type EventCardVariant = 'a' | 'b'

interface EventCardVariantStore {
  variant: EventCardVariant
  setVariant: (variant: EventCardVariant) => void
}

export const useEventCardVariantStore = create<EventCardVariantStore>()(
  persist(
    (set) => ({
      variant: 'a',
      setVariant: (variant) => set({ variant }),
    }),
    { name: 'gorave-event-card-variant', storage: createJSONStorage(() => AsyncStorage) },
  ),
)

export const useEventCardVariant = () => useEventCardVariantStore(s => s.variant)

/** Card width inside the home page's sideways carousels. */
export const EVENT_CARD_CAROUSEL_W: Record<EventCardVariant, number> = { a: 172, b: 300 }

/** Posters sit two per row in vertical lists; ticket rows take the full width. */
export const eventCardColumns = (v: EventCardVariant) => (v === 'a' ? 2 : 1)

export const EVENT_GRID_GAP = 12

/** Width of one cell in a two-column poster grid, given the list's side padding. */
export function eventGridCellWidth(sidePadding = 16) {
  return Math.floor((Dimensions.get('window').width - sidePadding * 2 - EVENT_GRID_GAP) / 2)
}
