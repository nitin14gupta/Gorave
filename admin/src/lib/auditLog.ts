export const ACTION_LABELS: Record<string, string> = {
  lock_user: 'Locked user',
  unlock_user: 'Unlocked user',
  restore_user: 'Restored deleted account',
  force_cancel_event: 'Force-cancelled event',
  refund_event: 'Refunded guests, held payout',
  update_support_status: 'Updated ticket status',
  remove_message: 'Removed reported message',
  keep_message: 'Kept reported message',
  remove_photo: 'Removed album photo',
  keep_photo: 'Kept album photo',
  approve_host_id: 'Approved host ID',
  reject_host_id: 'Rejected host ID',
  appeal_unlocked: 'Unlocked on appeal',
  appeal_denied: 'Kept locked on appeal',
  dismiss_user_reports: 'Dismissed reports on a person',
  warn_user: 'Warned a person',
  dismiss_event_reports: 'Dismissed reports on an event',
  warn_host: 'Warned a host',
}

export function targetHref(targetType: string, targetId: string | null): string | null {
  if (!targetId) return null
  if (targetType === 'user') return `/users/${targetId}`
  if (targetType === 'event') return `/events/${targetId}`
  return null
}
