export type HostBadgeTier = 'Rising' | 'Established' | 'Elite' | 'Legend'

export interface UserListItem {
  id: string
  name: string | null
  username: string | null
  phone: string
  country_code: string
  city: string | null
  gender?: string | null
  wallet_balance: number
  is_active: boolean
  is_deleted: boolean
  deleted_at: string | null
  purge_at: string | null
  is_locked: boolean
  created_at: string
  avatar: string | null
  host_badges: HostBadgeTier[]
}

export interface UserListResponse {
  items: UserListItem[]
  total: number
  page: number
  page_size: number
}

export interface UserProfile {
  id: string
  phone: string
  country_code: string
  name: string | null
  dob: string | null
  gender: string | null
  city: string | null
  bio: string | null
  interests: string[]
  badges: string[]
  username: string | null
  voice_url: string | null
  wallet_balance: number
  profile_complete: boolean
  is_active: boolean
  is_deleted: boolean
  deleted_at: string | null
  purge_at: string | null
  is_locked: boolean
  locked_reason: string | null
  locked_at: string | null
  locked_by: string | null
  is_host_onboarding_finished: boolean
  safety_agreement_accepted_at: string | null
  host_agreement_accepted_at: string | null
  /** Whether a host agreement signature is on file (the image itself isn't sent) */
  has_signature: boolean
  emergency_contacts_count: number
  host_avg_rating: number | null
  created_at: string
  updated_at: string
  host_badges: HostBadgeTier[]
}

export interface PayoutBankDetails {
  account_holder_name: string
  account_number_masked: string
  ifsc_code: string | null
  bank_name: string | null
}

export interface PayoutDetails {
  payout_method: 'upi' | 'bank' | null
  upi_id_masked: string | null
  bank_masked: PayoutBankDetails | null
  updated_at: string | null
}

export interface UserPhoto {
  id: string
  url: string
  position: number
  created_at: string
}

export interface HostedEvent {
  id: string
  title: string
  event_type: string
  date_time: string
  price_inr: number
  is_cancelled: boolean
  spots_left: number
  capacity: number
  created_at: string
  cover_photos: { url: string; position: number }[]
  city: string | null
  area: string | null
  join_mode: 'instant' | 'request'
  women_pct: number | null
  pending_requests: number
}

export interface JoinedEvent {
  id: string
  title: string
  event_type: string
  date_time: string
  price_inr: number
  status: string
  joined_at: string
  checked_in_at: string | null
  requested_at: string | null
  decided_at: string | null
}

export interface UserReviewRow {
  id: string
  rating: number
  body: string | null
  created_at: string
  event_id: string
  event_title: string
  /** The reviewer (on reviews received) */
  user_id?: string
  name?: string | null
}

export interface MessageReportRow {
  id: string
  reason: string
  description: string | null
  created_at: string
  reporter_name: string | null
  reporter_id: string
}

export interface WalletTransactionRow {
  id: string
  amount_inr: number
  type: 'credit' | 'debit' | 'refund_requested'
  source: string
  description: string | null
  expires_at: string | null
  created_at: string
}

export interface UserReportRow {
  id: string
  reason: string
  created_at: string
  reported_name?: string
  reported_id?: string
  reporter_name?: string
  reporter_id?: string
}

export interface BlockRow {
  id: string
  created_at: string
  name: string | null
  user_id: string
}

export interface SupportRequestRow {
  id: string
  topic: string
  message: string
  status: 'open' | 'resolved' | 'closed'
  created_at: string
}

export interface AppFeedbackRow {
  id: string
  text: string
  created_at: string
}

export interface VibeRequestRow {
  id: string
  status: string
  created_at: string
  name: string | null
  user_id: string
}

export interface UserDetail {
  user: UserProfile
  photos: UserPhoto[]
  hosted_events: HostedEvent[]
  joined_events: JoinedEvent[]
  wallet_transactions: WalletTransactionRow[]
  reports_filed: UserReportRow[]
  reports_received: UserReportRow[]
  blocked_by_user: BlockRow[]
  blocked_the_user: BlockRow[]
  support_requests: SupportRequestRow[]
  app_feedback: AppFeedbackRow[]
  vibe_requests_sent: VibeRequestRow[]
  vibe_requests_received: VibeRequestRow[]
  reviews_received: UserReviewRow[]
  reviews_given: UserReviewRow[]
  message_reports_received: MessageReportRow[]
}
