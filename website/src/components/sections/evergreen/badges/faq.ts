import type { AccordionItem } from '@/components/ui/Accordion'

// Badge FAQ. Only what the app actually does; no numbers beyond the thresholds.
export const BADGE_FAQ: AccordionItem[] = [
  {
    q: 'How do host badges work on Gorave?',
    a: 'Badges follow the number of events you have hosted. You become a Rising host at 2 events, Established at 10, Elite at 25 and Legend at 75.',
  },
  {
    q: 'Do I need to apply for a badge?',
    a: 'No. Badges are worked out automatically from the events you have hosted. Cross a threshold and the new badge shows up on its own.',
  },
  {
    q: 'Do cancelled events count towards my badge?',
    a: 'No. Only events you actually hosted count. Cancelled events are left out of the total.',
  },
  {
    q: 'Where do guests see my badge?',
    a: 'Guests see your badge on your events and on your host profile, so they know how many nights you have behind you before they request a spot.',
  },
  {
    q: 'How will I know when I reach a new badge?',
    a: 'The app sends you a push notification the moment you reach a new badge. For your first one it reads: "You\'re a Rising Host now! Keep it up: more hosted events means more visibility for your next one."',
  },
  {
    q: 'How do guest ratings fit in with badges?',
    a: 'Guests rate the events they go to, and your host rating shows alongside your badge. The badge says how many nights you have hosted; the rating says how they went.',
  },
]
