import type { FollowUser } from '@/api/apiService'

export interface FollowItemProps {
  user: FollowUser
  type: 'followers' | 'following'
  isMyProfile: boolean
  onFollow: (id: string) => void
  onUnfollow: (id: string) => void
  onRemove: (id: string) => void
  onDots: (user: FollowUser) => void
}

/** What the button on a person does, by list and whose list it is. */
export function followAction(p: FollowItemProps): { label: string; filled: boolean; run: () => void } | null {
  const u = p.user
  if (u.is_me) return null
  if (p.isMyProfile && p.type === 'followers') return { label: 'Remove', filled: false, run: () => p.onRemove(u.id) }
  if (p.isMyProfile && p.type === 'following') return { label: 'Following', filled: false, run: () => p.onUnfollow(u.id) }
  return u.is_following
    ? { label: 'Following', filled: false, run: () => p.onUnfollow(u.id) }
    : { label: u.follows_back ? 'Follow back' : 'Follow', filled: true, run: () => p.onFollow(u.id) }
}
