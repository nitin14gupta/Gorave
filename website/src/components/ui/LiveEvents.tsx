'use client'

import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import { SAMPLE_EVENTS, type SampleEvent } from '@/constants'
import { InviteCard } from './InviteCard'
import { EventDetailScreen } from './AppScreens'

// Real events (from the API, fetched once per page on the server) for the app
// mock-ups — invite cards, phone screens, chat previews. Sample events are only
// the offline fallback.
const Ctx = createContext<SampleEvent[]>(SAMPLE_EVENTS)

export function LiveEventsProvider({ events, children }: { events: SampleEvent[]; children: ReactNode }) {
  return <Ctx.Provider value={events.length ? events : SAMPLE_EVENTS}>{children}</Ctx.Provider>
}

export const useLiveEvents = () => useContext(Ctx)

/** The nth live event (wraps around), for mock-ups that just need "a real one". */
export function useLiveEvent(index = 0) {
  const events = useLiveEvents()
  return events[index % events.length]
}

export function LiveInviteCard({ index = 0, ...props }: { index?: number } & Omit<ComponentProps<typeof InviteCard>, 'event'>) {
  return <InviteCard event={useLiveEvent(index)} {...props} />
}

export function LiveEventDetailScreen({ index = 0, ...props }: { index?: number } & Omit<ComponentProps<typeof EventDetailScreen>, 'event'>) {
  return <EventDetailScreen event={useLiveEvent(index)} {...props} />
}
