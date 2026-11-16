export type AppealStatus = 'review' | 'unlocked' | 'denied'

/** A locked person's appeal, with what's needed to judge it. */
export interface AppealItem {
  id: string
  status: AppealStatus
  reason: 'not_me' | 'someone_else' | 'sorry'
  reason_label: string
  message: string
  selfie_url: string | null
  lock_reason: string | null
  locked_at: string | null
  locked_by_name: string | null
  created_at: string
  reviewed_at: string | null
  review_note: string | null
  reviewed_by_name: string | null
  user_id: string
  name: string | null
  username: string | null
  phone: string
  city: string | null
  joined_at: string
  photos: string[]
  report_count: number
  recent_reports: string[]
}
