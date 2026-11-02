import { EventDetailA } from './EventDetailA'
import { EventDetailB } from './EventDetailB'
import type { EventViewProps } from './parts'

/**
 * Event page (/e/id), what a shared link opens. Six sections: photos and
 * booking, the night, the crowd, where, your host, more nights. Booking
 * itself is handed to the app.
 */
export function EventDetailView({ variant, ...props }: EventViewProps & { variant: 'a' | 'b' }) {
  return variant === 'b' ? <EventDetailB {...props} /> : <EventDetailA {...props} />
}
