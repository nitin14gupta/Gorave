import { EVENT_TYPES, type City, type EventType, type PhotoKey } from '@/constants'

// Story content for each event type. The City × type page structure is the
// same for all six; this is what makes /mumbai/house-parties read differently
// from /mumbai/dinner-parties.

export interface TypeStory {
  /** "House parties"used in headings: "House parties in Mumbai" */
  plural: string
  /** "house party""What makes a good house party" */
  singular: string
  apiType: string
  heroPhoto: PhotoKey
  heroLine: string
  /** Anatomy callouts, what makes this kind of night work */
  anatomy: { label: string; detail: string }[]
  /** A typical night, hour by hour */
  night: { time: string; title: string; detail: string; photo: PhotoKey }[]
  /** Typical guest count used by the guest-list demo */
  capacity: number
  faq: (city: City) => { q: string; a: string }[]
}

/** The serialisable part, what client sections receive (no functions). */
export type TypeContent = Omit<TypeStory, 'faq'>

const commonFaq = (plural: string, city: City) => [
  {
    q: `Are ${plural.toLowerCase()} in ${city.name} free?`,
    a: 'Many are. Free events are request-to-join, so the host approves each guest. Paid ones book instantly with UPI plus a flat ₹50 platform fee.',
  },
  {
    q: `When do I get the address?`,
    a: "As soon as you're confirmed. Until then you see the area only, the exact address is never shown publicly.",
  },
  {
    q: `Can I host ${plural.toLowerCase()} in ${city.name}?`,
    a: 'Yes. Create the event in the app in a few minutes. Listing is free, you can run 2 free-entry events a month, and on paid events (from ₹99) you keep 90% of every ticket.',
  },
]

export const TYPE_STORIES: Record<string, TypeStory> = {
  'house-parties': {
    plural: 'House parties', singular: 'house party',  apiType: 'house_party', heroPhoto: 'party1',
    heroLine: 'Living rooms that turn into dance floors. Hosted by people, not clubs.',
    anatomy: [
      { label: 'The playlist', detail: 'Host-curated, guests add requests' },
      { label: 'BYOB', detail: 'Most hosts say it in the house rules' },
      { label: '20–40 people', detail: 'Big enough to dance, small enough to talk' },
      { label: 'Crowd mix', detail: 'Hosts can set 50:50 or women only' },
      { label: 'Address unlock', detail: 'Only confirmed guests see the flat number' },
    ],
    night: [
      { time: '8:30 PM', title: 'Doors', detail: 'QR check-in at the door, shoes off', photo: 'sceneDoor' },
      { time: '9:30 PM', title: 'Ice-breakers', detail: 'Someone always brings a card game', photo: 'game1' },
      { time: '11:00 PM', title: 'Living-room dance floor', detail: 'The coffee table moves to the balcony', photo: 'sceneLiving' },
      { time: '1:00 AM', title: 'Balcony debriefs', detail: 'The best conversations start late', photo: 'sceneRoof' },
    ],
    capacity: 30,
    faq: city => [
      { q: `How do house parties on Gorave work in ${city.name}?`, a: 'Hosts list their party, you request to join (free) or book (paid). Once confirmed you get your QR ticket and the address.' },
      ...commonFaq('House parties', city),
    ],
  },
  'rooftop-parties': {
    plural: 'Rooftop parties', singular: 'rooftop party',  apiType: 'rooftop', heroPhoto: 'roof1',
    heroLine: 'Sunsets, skylines and one more song on a terrace somewhere in the city.',
    anatomy: [
      { label: 'Golden hour start', detail: 'Most kick off around sunset' },
      { label: 'Live DJ or playlist', detail: 'Listed on the event page' },
      { label: '30–80 people', detail: 'Terraces hold a crowd' },
      { label: 'Ticketed', detail: 'Usually paid, book with UPI' },
      { label: 'Weather notes', detail: 'Hosts update you if plans change' },
    ],
    night: [
      { time: '6:00 PM', title: 'Golden hour', detail: 'Arrive while the sky is still orange', photo: 'roof1' },
      { time: '7:30 PM', title: 'First set', detail: 'The DJ warms up the terrace', photo: 'gig2' },
      { time: '9:00 PM', title: 'Skyline lights', detail: 'The city switches on below you', photo: 'roof2' },
      { time: '11:30 PM', title: 'Last song', detail: 'Neighbours permitting', photo: 'neon' },
    ],
    capacity: 60,
    faq: city => [
      { q: `Where are rooftop parties in ${city.name}?`, a: `Hosts across ${city.areas.slice(0, 3).join(', ')} and more. You see the area before booking and the exact address after.` },
      ...commonFaq('Rooftop parties', city),
    ],
  },
  'game-nights': {
    plural: 'Game nights', singular: 'game night',  apiType: 'game_night', heroPhoto: 'game1',
    heroLine: 'Catan, Mafia and friendly betrayal. The easiest way to meet strangers.',
    anatomy: [
      { label: 'The games', detail: 'Listed upfront, board, card or party games' },
      { label: 'Snacks', detail: 'Usually covered, sometimes potluck' },
      { label: '8–20 people', detail: 'Enough for two tables' },
      { label: 'Beginner friendly', detail: 'Hosts teach the rules' },
      { label: 'Free, mostly', detail: 'Request to join' },
    ],
    night: [
      { time: '8:00 PM', title: 'Pick a table', detail: 'Strategy, party or chaos', photo: 'game1' },
      { time: '9:00 PM', title: 'Round one', detail: 'Alliances form fast', photo: 'fr2' },
      { time: '10:30 PM', title: 'Mafia', detail: 'Everyone suspects the quiet one', photo: 'party3' },
      { time: '12:00 AM', title: 'Rematch', detail: 'Nobody goes home after one game', photo: 'fr1' },
    ],
    capacity: 16,
    faq: city => [
      { q: 'Do I need to know the games?', a: 'No, hosts explain the rules and most tables mix regulars with first-timers.' },
      ...commonFaq('Game nights', city),
    ],
  },
  'dinner-parties': {
    plural: 'Dinner parties', singular: 'dinner party',  apiType: 'dinner', heroPhoto: 'dine1',
    heroLine: 'Long tables, strangers and second helpings, cooked in someone’s home.',
    anatomy: [
      { label: 'The menu', detail: 'Courses listed on the event page' },
      { label: 'One long table', detail: 'Seating is part of the experience' },
      { label: '8–16 seats', detail: 'Intimate by design' },
      { label: 'Dietary notes', detail: 'Tell the host when you book' },
      { label: 'Ticketed', detail: 'Price covers the food' },
    ],
    night: [
      { time: '7:30 PM', title: 'Welcome drink', detail: 'Meet the people you’ll eat with', photo: 'drinks' },
      { time: '8:00 PM', title: 'First course', detail: 'The host tells the story of the dish', photo: 'dine2' },
      { time: '9:30 PM', title: 'Mains', detail: 'Plates get passed, seats get swapped', photo: 'dine1' },
      { time: '11:00 PM', title: 'Dessert & chai', detail: 'Nobody wants to leave', photo: 'dine3' },
    ],
    capacity: 12,
    faq: city => [
      { q: 'What about allergies or veg food?', a: 'Hosts list the menu upfront. Message them after booking with any dietary needs.' },
      ...commonFaq('Dinner parties', city),
    ],
  },
  'music-nights': {
    plural: 'Music nights', singular: 'music night',  apiType: 'music', heroPhoto: 'gig1',
    heroLine: 'Living-room gigs, open mics and jam circles, music up close.',
    anatomy: [
      { label: 'The line-up', detail: 'Artists listed on the event page' },
      { label: 'Unplugged, often', detail: 'Small rooms, real sound' },
      { label: '20–60 people', detail: 'Close enough to see the chords' },
      { label: 'Bring an instrument', detail: 'For jams and open circles' },
      { label: 'Free or ticketed', detail: 'Depends on the host' },
    ],
    night: [
      { time: '7:30 PM', title: 'Doors', detail: 'Grab a cushion near the front', photo: 'gig3' },
      { time: '8:00 PM', title: 'Opening act', detail: 'Someone new every week', photo: 'gig1' },
      { time: '9:30 PM', title: 'Headliner', detail: 'Phones down, mostly', photo: 'gig4' },
      { time: '11:00 PM', title: 'Open jam', detail: 'Anyone can join in', photo: 'fest' },
    ],
    capacity: 40,
    faq: city => [
      { q: 'Can I perform?', a: 'Open mics and jams list a sign-up in the event description, message the host.' },
      ...commonFaq('Music nights', city),
    ],
  },
  events: {
    plural: 'Events', singular: 'night',  apiType: 'other', heroPhoto: 'fr2',
    heroLine: 'Potlucks, swaps, garba nights, karaoke, everything that isn’t a category yet.',
    anatomy: [
      { label: 'Anything goes', detail: 'Read the description' },
      { label: 'Small groups', detail: 'Usually under 30' },
      { label: 'Verified guests', detail: '18+ and phone-verified' },
      { label: 'Free or paid', detail: 'Shown on every card' },
      { label: 'Host reviews', detail: 'Check ratings before you go' },
    ],
    night: [
      { time: '6:00 PM', title: 'Arrive', detail: 'Every event starts differently', photo: 'fr2' },
      { time: '7:30 PM', title: 'The thing itself', detail: 'Swap, cook, sing, dance', photo: 'fr1' },
      { time: '9:00 PM', title: 'Second wind', detail: 'Plans for next week begin', photo: 'party3' },
      { time: '10:30 PM', title: 'Goodbyes', detail: 'And a new group chat', photo: 'roof2' },
    ],
    capacity: 24,
    faq: city => commonFaq('Events', city),
  },
}

export const getEventType = (slug: string): EventType | undefined => EVENT_TYPES.find(t => t.slug === slug)
export const getTypeStory = (slug: string): TypeStory | undefined => TYPE_STORIES[slug]
