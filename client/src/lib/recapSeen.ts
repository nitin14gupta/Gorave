import AsyncStorage from '@react-native-async-storage/async-storage'
import ApiService from '@/api/apiService'
import type { MonthRecap } from '@/types/api'
import { getOrFetch, peekCached } from './queryCache'

// "Your month on Gorave" on the phone.
//
// The latest recap (last month's) only changes on the 1st, so it's fetched
// once a month and kept on the phone: the cache key is this month, so a new
// month means a new key and one fresh fetch. "No recap" is cached too; a
// network error isn't, so it tries again next time. Cleared on logout with
// the rest of the cache.

const istMonth = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 7)
const recapKey = () => `recap:${istMonth()}`

/** Last month's recap, from memory, the phone, or (once a month) the server. Null if there isn't one. */
export function getLatestRecap(): Promise<MonthRecap | null> {
  return getOrFetch<MonthRecap | null>(
    recapKey(),
    () => ApiService.getMonthRecap().catch((e: any) => {
      if (e?.code === 'NO_RECAP') return null
      throw e
    }),
    { ttlMs: null },
  )
}

/** What's already in memory, for painting on the first frame. */
export function peekLatestRecap(): MonthRecap | null {
  return peekCached<MonthRecap | null>(recapKey())
}

// Per-month flags:
//   revealed   the full-screen recap has been shown once (auto-open or a tap)
//   dismissed  the Home card was closed
type Flag = 'revealed' | 'dismissed'
const flagKey = (flag: Flag, month: string) => `vibe-recap-${flag}-${month}`

export async function getRecapFlag(flag: Flag, month: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(flagKey(flag, month))) === '1'
  } catch {
    return false
  }
}

export async function setRecapFlag(flag: Flag, month: string): Promise<void> {
  try {
    await AsyncStorage.setItem(flagKey(flag, month), '1')
  } catch {
    // Not worth surfacing: worst case the card shows once more.
  }
}
