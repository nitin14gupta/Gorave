export interface EventPhoto {
  url: string
  position: number
}

export interface EventListItem {
  id: string
  title: string
  event_type: string
  date_time: string
  price_inr: number
  is_free: boolean
  platform_fee_inr: number
  host_commission_inr: number
  platform_profit_inr: number
  is_cancelled: boolean
  capacity: number
  spots_left: number
  created_at: string
  cover_photos: EventPhoto[]
  host_id: string
  host_name: string | null
  attendee_count: number
  city: string | null
  area: string | null
  join_mode: 'instant' | 'request'
  women_pct: number | null
  pending_requests: number
}

export interface CityCount {
  city: string
  count: number
}

export interface EventDetailInfo {
  id: string
  title: string
  description: string | null
  rules: string | null
  event_type: string
  date_time: string
  end_time: string | null
  capacity: number
  spots_left: number
  age_restriction: number
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  city: string | null
  area: string | null
  /** Exact address, private to the host and confirmed guests in the app */
  address_line1: string | null
  address_line2: string | null
  pincode: string | null
  join_mode: 'instant' | 'request'
  /** % of spots for women; null = open crowd */
  women_pct: number | null
  pending_requests: number
  /** Who's in now (going, plus held waitlist offers), by gender bucket */
  gender_counts: { women: number; men: number; other: number }
  /** The host's split in seats; null = open crowd */
  quota: { women: number; men: number; open: number } | null
  ratio_left: { women_pct: number; women_left: number; men_left: number; open_left: number } | null
  price_inr: number
  is_free: boolean
  platform_fee_inr: number
  host_commission_inr: number
  platform_profit_inr: number
  cover_photos: EventPhoto[]
  is_published: boolean
  is_cancelled: boolean
  created_at: string
  updated_at: string
  host_id: string
  host_name: string | null
  host_phone: string
  avg_rating: number | null
}

export interface EventAttendeeRow {
  id: string
  status?: string
  joined_at: string
  checked_in_at: string | null
  payment_id?: string | null
  offer_expires_at: string | null
  user_id: string
  name: string | null
  phone: string
  gender?: string | null
}

export interface JoinRequestRow {
  id: string
  status: 'requested' | 'declined' | 'expired'
  requested_at: string | null
  decided_at: string | null
  request_count: number
  user_id: string
  name: string | null
  phone: string
  gender: string | null
  city: string | null
  age: number | null
  avatar: string | null
}

export interface EventReviewRow {
  id: string
  rating: number
  body: string | null
  created_at: string
  user_id: string
  name: string | null
}

export interface EventReportRow {
  id: string
  reason: string
  description: string | null
  created_at: string
  user_id: string
  name: string | null
}

export interface EventDetailResponse {
  event: EventDetailInfo
  attendees: EventAttendeeRow[]
  waitlist: EventAttendeeRow[]
  requests: JoinRequestRow[]
  reviews: EventReviewRow[]
  reports: EventReportRow[]
}
