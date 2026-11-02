export const CacheKeys = {
  homeJoinedEvents: 'home:joined-events',
  /** "You're Hosting" */
  homeHostedEvents: 'home:hosted-events',
  /** "On the Waitlist" */
  homeWaitlistedEvents: 'home:waitlisted-events',
  homeRequestedEvents: 'home:requested-events',

  chatConversations: 'chat:conversations',
  chatMessages: (conversationId: string) => `chat:messages:${conversationId}`,
  /** The chat: prefix keeps it encrypted on disk. */
  eventChat: (eventId: string) => `chat:event:${eventId}`,

  /** No userId → the signed-in user's own profile. */
  profile: (userId?: string) => (userId ? `profile:${userId}` : 'profile:me'),

  /** TTL'd to the event's start time — see callers. */
  ticket: (eventId: string) => `ticket:v2:${eventId}`,
  /** The last full event you opened, memory only: shown instantly on reopen, never trusted for booking. */
  eventDetail: (eventId: string) => `event:${eventId}`,
  eventCover: (eventId: string) => `event-cover:${eventId}`,
  /** Private photos with signed links: memory only, never written to disk. */
  album: (eventId: string) => `album:${eventId}`,
} as const
