export const ACTION_LABELS: Record<string, string> = {
  lock_user: 'Locked user',
  unlock_user: 'Unlocked user',
  restore_user: 'Restored deleted account',
  force_cancel_event: 'Force-cancelled event',
  update_support_status: 'Updated ticket status',
  remove_message: 'Removed reported message',
  keep_message: 'Kept reported message',
  remove_photo: 'Removed album photo',
  keep_photo: 'Kept album photo',
  approve_host_id: 'Approved host ID',
  reject_host_id: 'Rejected host ID',
}

export function targetHref(targetType: string, targetId: string | null): string | null {
  if (!targetId) return null
  if (targetType === 'user') return `/users/${targetId}`
  if (targetType === 'event') return `/events/${targetId}`
  return null
}
