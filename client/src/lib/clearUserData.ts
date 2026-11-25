import AsyncStorage from '@react-native-async-storage/async-storage'
import type { StoreApi, UseBoundStore } from 'zustand'
import { useChatSearchHistoryStore } from '@/store/chatSearchHistoryStore'
import { useChatUnreadStore } from '@/store/chatUnreadStore'
import { useCityFilterStore } from '@/store/cityFilterStore'
import { useHotlistStore } from '@/store/hotlistStore'
import { useLastPaymentStore } from '@/store/lastPaymentStore'
import { useLockStore } from '@/store/lockStore'
import { useNotifStore } from '@/store/notifStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useOnboardingStore } from '@/store/onboarding'
import { useRecentEventsStore } from '@/store/recentEventsStore'
import { useSafetyAgreementStore } from '@/store/safetyAgreementStore'
import { useSafetyStore } from '@/store/safetyStore'
import { useSearchHistoryStore } from '@/store/searchHistoryStore'
import { useSignatureCaptureStore } from '@/store/signatureCaptureStore'
import { useVibeStore } from '@/store/vibeStore'
import { useViewLimitStore } from '@/store/viewLimitStore'

// Everything that belongs to the person signed in, so the next account on this
// phone starts clean: searches, recently viewed, city filter, notifications,
// emergency contacts, hotlist, onboarding draft, last UPI app, chat view
// limits, unread counts. Each store goes back to how it starts, in memory and
// on the phone. Kept: the phone's own settings (card or list view, flyer
// theme, location). The main cache is cleared separately (queryCache).
//
// Add any new store that holds someone's data here.
type AnyStore = UseBoundStore<StoreApi<any>> & { persist?: { clearStorage: () => void } }

const USER_STORES: AnyStore[] = [
  useChatSearchHistoryStore,
  useChatUnreadStore,
  useCityFilterStore,
  useHotlistStore,
  useLastPaymentStore,
  useLockStore,
  useNotifStore,
  useOnboardingStore,
  useRecentEventsStore,
  useSafetyAgreementStore,
  useSafetyStore,
  useSearchHistoryStore,
  useSignatureCaptureStore,
  useVibeStore,
  useViewLimitStore,
] as AnyStore[]

// Saved outside any store.
const LOOSE_KEYS = ['notifications_cache_v1', 'notif_last_seen_count', 'calendar_filters']
const LOOSE_PREFIXES = ['vibe-recap-']

export function clearUserData(): void {
  for (const store of USER_STORES) {
    try {
      store.setState(store.getInitialState(), true)
      store.persist?.clearStorage()
    } catch {}
  }
  // The push token was registered for the person leaving: forget it so the
  // next sign-in registers it for the new account. Notification permission is
  // the phone's, so it stays.
  useNotificationStore.getState().setRegisteredToken(null)

  AsyncStorage.getAllKeys()
    .then(keys => AsyncStorage.multiRemove(
      keys.filter(k => LOOSE_KEYS.includes(k) || LOOSE_PREFIXES.some(p => k.startsWith(p))),
    ))
    .catch(() => {})
}
