import type { Conversation } from '@/types/api'

// Who is on the other end of each conversation, as of the last inbox fetch.
// Opening a chat reads this first so the header shows the name and photo on
// the very first frame (the photo itself is already in expo-image's cache
// from the inbox row), then the screen refreshes it from the server. A new
// profile photo comes with a new URL, so the image cache never shows a stale one.

const partners = new Map<string, Conversation>()

export function rememberConversations(list: Conversation[]): void {
  for (const c of list) partners.set(c.id, c)
}

export function peekConversation(convId: string): Conversation | undefined {
  return partners.get(convId)
}
