export interface UserReportItem {
  id: string
  reason: string
  created_at: string
  reporter_id: string
  reporter_name: string | null
  reporter_phone: string
  reported_id: string
  reported_name: string | null
  reported_phone: string
}

export interface EventReportItem {
  id: string
  reason: string
  description: string | null
  created_at: string
  reporter_id: string
  reporter_name: string | null
  reporter_phone: string
  event_id: string
  event_title: string
  event_is_cancelled: boolean
}

export type ReportStatus = 'open' | 'done'
export type Resolution = 'removed' | 'kept' | null

/** One reported message, all its reports grouped. */
export interface MessageReportItem {
  message_id: string
  message_content: string | null
  message_content_type: string
  message_sent_at: string
  unsent_at: string | null
  media_url: string | null
  conversation_id: string
  chat_kind: 'direct' | 'event'
  event_id: string | null
  event_title: string | null
  sender_id: string
  sender_name: string | null
  sender_phone: string
  report_count: number
  reasons: string[]
  descriptions: string[]
  reporter_names: string[]
  last_reported_at: string
  resolution: Resolution
  resolved_at: string | null
}

export interface ContextMessage {
  id: string
  content: string | null
  content_type: string
  sent_at: string
  unsent_at: string | null
  sender_name: string | null
  sender_id: string
  media_url: string | null
  reported: boolean
}

/** One reported album photo, all its reports grouped. */
export interface PhotoReportItem {
  id: string
  event_id: string
  event_title: string
  created_at: string
  hidden_at: string | null
  removed_at: string | null
  url: string | null
  uploader_id: string
  uploader_name: string | null
  uploader_phone: string
  report_count: number
  reasons: string[]
  last_reported_at: string
  resolution: Resolution
  resolved_at: string | null
}

export interface BlockItem {
  id: string
  created_at: string
  blocker_id: string
  blocker_name: string | null
  blocker_phone: string
  blocked_id: string
  blocked_name: string | null
  blocked_phone: string
}
