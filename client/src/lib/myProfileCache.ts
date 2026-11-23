import type { ProfileResponse } from '@/types/api'
import { CacheKeys } from '@/constants/cacheKeys'
import { markStale, peekCached, setCached } from './queryCache'

// Your own profile is cached on the phone and shown instantly (hooks/useProfile),
// the way Instagram does it:
//   - you edit it (bio, details, photos, voice, city): mark it out of date, so
//     the next visit refetches in the background (api/user.ts calls this)
//   - you follow or unfollow someone: your "vibing" count changes right away
//     (ApiService.followUser / unfollowUser call this)
//   - what others change (vibers, badges, verified): a quiet background refresh
//     once the copy is MY_PROFILE_TTL_MS old, or pull to refresh

export const MY_PROFILE_TTL_MS = 10 * 60_000

export function markMyProfileStale(): void {
  markStale(CacheKeys.profile())
}

export function bumpMyVibing(delta: number): void {
  const key = CacheKeys.profile()
  const me = peekCached<ProfileResponse>(key)
  if (me) setCached(key, { ...me, vibing_count: Math.max(0, (me.vibing_count ?? 0) + delta) }, MY_PROFILE_TTL_MS)
}
