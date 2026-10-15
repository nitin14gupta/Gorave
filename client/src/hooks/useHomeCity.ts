import { useOnboardingStore } from '@/store/onboarding'
import { useCityFilterStore } from '@/store/cityFilterStore'
import { peekCached } from '@/lib/queryCache'
import { CacheKeys } from '@/constants'
import type { ProfileResponse } from '@/api/user'

/** The user's home city — the server profile when we have it cached,
 * otherwise what they picked during onboarding / Change City. */
export function useHomeCity(): string | null {
  const stored = useOnboardingStore(s => s.city)
  const cached = peekCached<ProfileResponse>(CacheKeys.profile())
  return cached?.city ?? stored ?? null
}

/** The city the Events tab browses: an explicit pick, else the home city. */
export function useBrowseCity(): { city: string | null; setCity: (c: string | null) => void } {
  const home = useHomeCity()
  const picked = useCityFilterStore(s => s.city)
  const setCity = useCityFilterStore(s => s.setCity)
  return { city: picked ?? home, setCity }
}
