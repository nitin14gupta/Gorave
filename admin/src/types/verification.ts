export type VerificationStatus = 'review' | 'verified' | 'rejected' | 'failed'
export type Match = 'match' | 'partial' | 'mismatch' | 'unknown'

/** One PAN check, next to the profile it's for. */
export interface HostVerificationItem {
  id: string
  status: VerificationStatus
  /** Why the automatic check said no (failed only). */
  failure_reason: string | null
  id_masked: string | null
  full_name: string | null
  dob: string | null
  gender: string | null
  state: string | null
  masked_aadhaar: string | null
  aadhaar_linked: boolean | null
  category: string | null
  matches: { name: Match; dob: Match; gender: Match } | null
  created_at: string
  reviewed_at: string | null
  review_note: string | null
  reviewed_by_name: string | null
  user_id: string
  profile_name: string | null
  username: string | null
  phone: string
  profile_dob: string | null
  profile_gender: string | null
  city: string | null
  joined_at: string
  avatar: string | null
  attempts: number
}
