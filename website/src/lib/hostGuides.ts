import type { PhotoKey } from '@/constants'
import { slugify } from '@/lib/seo'

// Hosting guides (/host/guides). Plain data only, so client sections can take it
// straight from a server component. Product facts here must match the app:
// free listing, 2 free-entry events a month, paid tickets from ₹99 with the
// host keeping 90%, a flat ₹50 guest platform fee, UPI/bank payouts.

export const GUIDE_CATEGORIES = ['Planning', 'Crowd', 'Money', 'Safety'] as const
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number]

export interface GuideSection {
  heading: string
  paragraphs: string[]
  tips?: string[]
}

export interface HostGuide {
  slug: string
  title: string
  /** One-line standfirst under the title */
  dek: string
  category: GuideCategory
  readMinutes: number
  hero: PhotoKey
  body: GuideSection[]
}

type GuideDraft = Omit<HostGuide, 'readMinutes'>

const DRAFTS: GuideDraft[] = [
  {
    slug: 'how-to-throw-a-house-party',
    title: 'How to throw a house party people talk about',
    dek: 'From counting the room to the morning-after thank-you: the whole night, planned backwards.',
    category: 'Planning',
    hero: 'party1',
    body: [
      {
        heading: 'Start with the room, not the guest list',
        paragraphs: [
          'Most house parties go wrong before a single invite goes out: the host invites the people they like and then tries to fit them into the flat. Do it the other way round. Walk through the space you will actually use, the hall, the balcony and maybe the kitchen, and picture people standing in it with a drink in hand.',
          'A room feels full long before it is physically packed. Pick a number where people can still move to the speaker or the snacks without squeezing past anyone, and make that your capacity. You can always open up a few more spots later. Taking spots back is much harder.',
        ],
        tips: [
          'Bedrooms are not party space. Lock them or keep the door shut, and keep bags in one place.',
          'Count chairs and floor cushions. If fewer than a third of guests can sit, the night gets tiring early.',
        ],
      },
      {
        heading: 'Pick a date and give it an end time',
        paragraphs: [
          'Friday and Saturday nights are the obvious picks, but they compete with everything else in the city. A Sunday afternoon or a long-weekend evening can draw a more relaxed crowd that actually stays.',
          'Put an end time on the listing, not just a start time. It tells guests what kind of night it is, it gives your neighbours a fair deal, and it saves you from the awkward 2 AM hint-dropping.',
        ],
        tips: ['Check the date against festivals, cricket matches and exam season before you list. Your guests will.'],
      },
      {
        heading: 'Write a listing that does the inviting for you',
        paragraphs: [
          'Your listing is the invite. A clear title, an honest description of the vibe and a good cover do most of the work. Gorave has ready-made invite templates, from houseparty and retro to nightout and halloween, so you are not designing a flyer at midnight.',
          'Say what guests should know before they request: the music, the dress code if there is one, whether to bring anything, and roughly where it is. The exact address is only shown to guests you have confirmed, so naming the area is enough.',
        ],
        tips: [
          'Write the description the way you would text a friend. "Chill, music, card games, bring your own bottle" beats a paragraph of adjectives.',
          'If you change details after people have joined, Gorave notifies your guests, so update the listing instead of messaging people one by one.',
        ],
      },
      {
        heading: 'Sort food, drinks and music a day early',
        paragraphs: [
          'Running out of ice or cups at 10 PM is the most common, and most avoidable, house party problem. Make a list the day before: water, ice, cups, napkins, garbage bags, one snack people can eat standing up, and something for guests who are not drinking.',
          'For music, make one long playlist in advance or hand it to one friend you trust. A shared queue sounds democratic but usually ends in a fight over the next song.',
        ],
        tips: ['Buy more water than you think you need. Nobody has ever complained about too much water.'],
      },
      {
        heading: 'Set up the flat like a host, not a resident',
        paragraphs: [
          'An hour before guests arrive, stand at your front door and look in. Where do shoes go? Where do bags go? Where is the bathroom, and does it have soap, a towel and a spare roll? Can people find the drinks without asking?',
          'Lighting matters more than decoration. Switch off the tube lights, turn on lamps or fairy lights, and keep one corner a little brighter for people who want to talk.',
        ],
      },
      {
        heading: 'On the night, work the door, then the room',
        paragraphs: [
          'For the first hour, be at or near the door. Greet everyone by name, scan their ticket and introduce them to at least one person. A guest who knows one other person in the first ten minutes stays all night.',
          'Once most people are in, walk the room. Pull the quiet person into a conversation, refill the ice, and keep an eye on the volume. Your job tonight is the room, not the dance floor.',
        ],
        tips: ['Ask one friend to be your co-host for the night. Two people noticing things is much better than one.'],
      },
      {
        heading: 'The morning after counts too',
        paragraphs: [
          'Send a short thank-you to the group the next day. It costs nothing and it is the reason people come back. Guests can leave reviews after the event, and reviews are what new guests read before they request your next one.',
          'Host a few times and it starts to show on your profile. Gorave host badges begin at Rising after 2 events and go up through Established, Elite and Legend as you keep hosting.',
        ],
      },
    ],
  },
  {
    slug: 'setting-the-crowd-mix',
    title: 'Setting the crowd mix for your night',
    dek: 'Open, 50:50 or women-only: how to pick a mix, read requests, and keep the room feeling right.',
    category: 'Crowd',
    hero: 'fr1',
    body: [
      {
        heading: 'Why the mix matters more than the number',
        paragraphs: [
          'Two parties with the same headcount can feel completely different. One where everyone came in a big group of friends feels closed off to the solo guest. One that is lopsided in any direction can feel awkward quickly. The mix is a big part of the vibe, and it is one of the few parts you control before anyone walks in.',
          'Free events on Gorave are request-to-join, which means you see who is asking and you decide. The crowd mix setting simply helps you hold the shape you planned while the requests come in.',
        ],
      },
      {
        heading: 'The options, in plain words',
        paragraphs: [
          'Open means no ratio at all: you accept whoever fits. 50:50 and 60:40 hold a balance between women and men. Women-only and men-only do exactly what they say. And custom lets you set your own split in 10% steps if none of the presets fit your night.',
          'Whatever you pick, 10% of seats are always kept open, so a mixed group of friends or someone who does not fit a box still has a way in.',
        ],
        tips: ['If you are not sure, start with Open and see who requests. You can make the mix tighter later.'],
      },
      {
        heading: 'Match the mix to the kind of night',
        paragraphs: [
          'A dance-floor house party usually works best balanced. A supper club or a board game night cares less about ratio and more about people who will actually talk. A girls’ night is women-only by design, and saying so upfront saves everyone an awkward decline.',
          'Think about who you would feel comfortable having in your home, and who your first few guests will feel comfortable around. That answer usually picks the mix for you.',
        ],
      },
      {
        heading: 'Reading requests well',
        paragraphs: [
          'Every guest on Gorave is phone-verified and 18+, so you are not starting from zero. Look at the profile, any reviews from earlier events, and whether they have said something about why they want to come. A short, friendly note is a good sign.',
          'Accept or decline as early as you can. People plan their weekends around your answer. Keep in mind that a declined guest cannot request the same event again, so decline when you mean it, not as a "maybe".',
        ],
        tips: [
          'Accept in small batches over a few days rather than all at once. It keeps the mix on track as later requests arrive.',
          'Groups of friends are great, but one group should not be half the room.',
        ],
      },
      {
        heading: 'Use the age gate if the night needs it',
        paragraphs: [
          'Everyone is already 18+. If your night suits a narrower crowd, say a quieter 25+ dinner, you can add an age gate so only guests in that range can request. Mention it in your description too, so nobody is surprised.',
        ],
      },
      {
        heading: 'When requests come in lopsided',
        paragraphs: [
          'Sometimes the requests just do not match your ratio. Do not force it by accepting people you are unsure about. When your spots fill up, new requests go on the waitlist, and you can pull from it when someone drops out.',
          'It also helps to look at your listing again. The title, the cover and the description decide who requests. If you want a different crowd, describe a different night.',
        ],
      },
    ],
  },
  {
    slug: 'pricing-your-first-ticketed-event',
    title: 'Pricing your first ticketed event',
    dek: 'Free or paid, what to count, and the simple maths of what actually reaches your account.',
    category: 'Money',
    hero: 'dine1',
    body: [
      {
        heading: 'Free, or worth charging for?',
        paragraphs: [
          'Not every night needs a ticket. Listing on Gorave is free, and you can run 2 free-entry events every month. Free events are request-to-join, which is great for building a guest list and getting your first reviews.',
          'Charge when you are spending real money on the night: a cook, a DJ, decent drinks, a rented space, or simply a lot of your time. A ticket also changes behaviour. People who paid are far more likely to actually turn up.',
        ],
      },
      {
        heading: 'Count your real costs first',
        paragraphs: [
          'Write down everything the night costs you before you think about price. Food and drinks, ice and disposables, any equipment you rent, decorations, the cleaning after, and anything you are paying a friend or a professional.',
          'Divide that by the number of guests you expect, not the number of spots you list. Not every spot always sells, and pricing for a full house is how first-time hosts end up out of pocket.',
        ],
        tips: ['Add a small buffer for the thing you forgot. There is always a thing you forgot.'],
      },
      {
        heading: 'The maths of what you keep',
        paragraphs: [
          'Paid tickets on Gorave start at ₹99, and you keep 90% of the ticket price you set. Guests pay a flat ₹50 platform fee on top of your price, so your price stays your price.',
          'A quick example: if you price a ticket at ₹499, you keep ₹449.10 of it, and the guest sees your ₹499 plus the ₹50 fee at checkout. Do this sum for your own price before you publish, so the number in your head matches the number in your account.',
        ],
        tips: ['Round, familiar prices like ₹299, ₹499 or ₹799 are easier for guests to say yes to than odd ones.'],
      },
      {
        heading: 'Price the night you are promising',
        paragraphs: [
          'Your price is also a signal. A ₹199 game night and a ₹1,499 eight-course supper club are both fair. They are just different nights. Look at what similar events near you charge, then ask whether yours offers more, less or something different.',
          'For a first ticketed event, it is fine to price a little lower to fill the room and collect reviews. Raising the price for your next event is easier when you have a full house and a few good reviews behind you.',
        ],
      },
      {
        heading: 'Say exactly what the ticket includes',
        paragraphs: [
          'Guests do not mind paying. They mind surprises. Spell out what the ticket covers: welcome drink or BYOB, dinner or snacks, a game, a set by a DJ. If something costs extra on the night, say so in the listing.',
          'Try to settle the details before tickets go on sale. You can still edit later, and Gorave notifies guests when you do, but a listing that keeps changing makes people nervous about what they paid for.',
        ],
      },
      {
        heading: 'Getting paid',
        paragraphs: [
          'Payouts go to your UPI ID or bank account. Set up your payout details before the event, not the night after, so there is nothing to chase once the party is over.',
          'Keep a simple note of what you spent and what came in after each event. After two or three nights you will know your real costs and your price almost by heart.',
        ],
      },
    ],
  },
  {
    slug: 'writing-house-rules-guests-follow',
    title: 'Writing house rules guests actually follow',
    dek: 'Short, friendly and said before anyone arrives: rules that protect your home without killing the mood.',
    category: 'Safety',
    hero: 'party3',
    body: [
      {
        heading: 'Fewer rules, said early',
        paragraphs: [
          'A wall of rules reads like you expect trouble. A handful of clear ones reads like you have hosted before. Pick the four or five things that genuinely matter in your home and drop the rest.',
          'Timing matters as much as wording. Rules in the listing are agreed to before anyone requests. Rules announced at midnight feel like a telling-off.',
        ],
      },
      {
        heading: 'Explain the why, briefly',
        paragraphs: [
          'People follow rules they understand. "Shoes off, we sit on the floor" lands better than "No shoes". "Smoking on the balcony only, my landlord checks" lands better than "No smoking inside". One short reason is enough.',
        ],
        tips: ['Write rules as "we" and "please", not "do not" and "strictly". It is your home, not a club.'],
      },
      {
        heading: 'The rules most hosts end up needing',
        paragraphs: [
          'Plus-ones: say clearly whether guests can bring someone, and that anyone extra needs their own confirmed spot. Smoking and drinking: where, and whether it is BYOB. Rooms: which ones are off limits. Photos: whether it is fine to post, and to ask before posting someone else. Leaving: when the night ends and to keep it quiet on the way out.',
          'And one about respect: everyone should feel comfortable, and anyone who makes another guest uncomfortable will be asked to leave. You hope never to use it, but saying it upfront makes it much easier if you ever have to.',
        ],
        tips: ['If you have pets, say so in the rules. Some guests are allergic, and some will want to know the dog’s name.'],
      },
      {
        heading: 'Put them where people will see them',
        paragraphs: [
          'The listing is the main place, because guests read it before they request. Repeat the two most important rules at the door when you check people in, and stick a small handwritten note on the bathroom or balcony door if it applies there.',
        ],
      },
      {
        heading: 'Enforce kindly, and early',
        paragraphs: [
          'The first time a rule slips, deal with it quietly and with a smile. A word on the side early in the night is easy. Letting it go until it is a pattern makes it a confrontation.',
          'If someone really is not respecting your home or your guests, ask them to leave, calmly and away from the crowd. Having a co-host with you makes this much easier. You are allowed to protect your own space.',
        ],
      },
      {
        heading: 'Learn from each night',
        paragraphs: [
          'After the event, read your reviews and think about what actually went wrong, if anything. Add a rule only when something real happened, and drop rules that never came up. Over a few nights your list gets shorter and better.',
        ],
      },
    ],
  },
  {
    slug: 'keeping-neighbours-happy',
    title: 'Keeping the neighbours (and the society) happy',
    dek: 'Noise, lifts, parking and the 10 PM question: how to host without becoming the flat everyone complains about.',
    category: 'Safety',
    hero: 'roof1',
    body: [
      {
        heading: 'Tell them before they hear it',
        paragraphs: [
          'The easiest complaint to handle is the one that never happens. A day or two before, let your immediate neighbours know: a short note under the door, a message, or a word in the lift. Say the date, roughly how many people, and when it will wind down.',
          'Most people are fine with a party they knew about. It is the surprise at 11 PM that turns into a call to the secretary.',
        ],
        tips: ['Share your number with the neighbours and ask them to message you first if anything bothers them.'],
      },
      {
        heading: 'Know your building’s rules',
        paragraphs: [
          'Housing societies and RWAs often have their own rules about guests, terrace or clubhouse use, parking and timings. They vary a lot from building to building, so check with your society office or managing committee before you plan, especially for a rooftop or common area.',
          'Many cities also expect amplified music to come down around 10 PM. The exact rules depend on where you live, so treat this as general guidance, not legal advice, and find out what applies in your area.',
        ],
      },
      {
        heading: 'Manage the sound, not just the volume',
        paragraphs: [
          'Bass carries through walls and floors far more than voices. Keep speakers off the floor and away from shared walls, point them into the room rather than out of a window, and keep the bass lower than you would like.',
          'Plan the night so it gets quieter as it goes: dancing earlier, conversation and games later. Closing windows and balcony doors after 10 PM makes a big difference.',
        ],
        tips: ['Walk out into the corridor once the party is going. If you can hear it clearly there, so can your neighbours.'],
      },
      {
        heading: 'Arrivals, lifts, parking and the gate',
        paragraphs: [
          'Thirty people arriving at once means a crowded lobby, a busy lift and a confused security guard. Let the gate know you are expecting guests, and share names in advance if your building asks for them.',
          'Tell guests where to park, or not to drive at all. Cars blocking a neighbour’s spot cause more society fights than music does.',
        ],
      },
      {
        heading: 'A quiet goodbye',
        paragraphs: [
          'The noisiest moment of many parties is the end, when everyone says goodbye in the corridor at full volume. Remind guests to keep it down on the way out, and stagger the exit if you can.',
          'The next morning, check the stairwell, the lift and the gate area for any mess your guests left behind. It is a small thing that buys a lot of goodwill.',
        ],
      },
      {
        heading: 'If someone complains',
        paragraphs: [
          'Respond quickly and calmly. Turn it down first and discuss later. Thank them for telling you directly, and apologise even if you think the music was fine. A neighbour who feels heard rarely escalates.',
          'If there is a pattern of complaints, take it seriously. Move the party indoors, end earlier, or host somewhere else for a while. Being the building’s good host is worth more than one loud night.',
        ],
      },
    ],
  },
  {
    slug: 'running-the-door-qr-check-in',
    title: 'Running the door with QR check-in',
    dek: 'The first two minutes of every guest’s night happen at your door. Here is how to make them smooth.',
    category: 'Planning',
    hero: 'gig2',
    body: [
      {
        heading: 'Why the door matters',
        paragraphs: [
          'The door is where you confirm that the person walking in is the person you accepted. It is also where a guest decides whether this is going to be a good night. A slow, confused entry sets the wrong tone. A quick scan and a warm hello sets the right one.',
        ],
      },
      {
        heading: 'Before the night',
        paragraphs: [
          'Every confirmed guest gets a QR ticket in the app. Only confirmed guests see your exact address, so the people turning up are the people you said yes to.',
          'A few hours before, remind guests to keep their ticket ready and their screen brightness up. A queue of people searching their phones for a ticket in a dark corridor is a slow start.',
        ],
        tips: ['Charge your own phone fully and check your mobile data or Wi-Fi works at the door.'],
      },
      {
        heading: 'Set up a proper door',
        paragraphs: [
          'Choose one spot where people enter, with decent light. Put a small table or shelf there for your phone and a bowl for keys if you need it. If you are expecting a big crowd, ask a co-host to stay near the door while you greet.',
        ],
      },
      {
        heading: 'Scanning, one guest at a time',
        paragraphs: [
          'You scan each guest’s QR from the app as they arrive. One ticket, one person. Do not wave a whole group in on one scan, because that is how a party of twenty quietly becomes thirty.',
          'If a code will not scan, do not panic. Turn up their screen brightness, try again, and if it still fails, find them on your confirmed guest list and greet them in.',
        ],
        tips: ['Say each guest’s name when you scan them in. It is a small thing that makes people feel expected.'],
      },
      {
        heading: 'People who are not on the list',
        paragraphs: [
          'Someone will turn up with a friend who "just wants to come in for a bit". Decide your answer before the night, and give it kindly. If you have room and the friend has a phone, they can request the event and you can accept them properly. If you do not have room, it is a no, and that is fine.',
        ],
      },
      {
        heading: 'Late arrivals and early exits',
        paragraphs: [
          'Late guests still need a scan, so keep your phone with you after the rush. If you are going to be away from the door, tell guests to message you when they arrive.',
          'When the night is over, the door works in reverse: say goodbye, remind people to keep it quiet on the way out, and ask them to leave a review. A good exit is a good review.',
        ],
      },
    ],
  },
]

const words = (g: GuideDraft) =>
  [g.title, g.dek, ...g.body.flatMap(s => [s.heading, ...s.paragraphs, ...(s.tips ?? [])])].join(' ').split(/\s+/).length

/** All guides, in the recommended reading order. */
export const HOST_GUIDES: HostGuide[] = DRAFTS.map(g => ({ ...g, readMinutes: Math.max(3, Math.round(words(g) / 200)) }))

export const getGuide = (slug: string) => HOST_GUIDES.find(g => g.slug === slug)

/** The guide after this one in reading order (wraps around). */
export function nextGuide(slug: string) {
  const i = HOST_GUIDES.findIndex(g => g.slug === slug)
  return HOST_GUIDES[(i + 1) % HOST_GUIDES.length]
}

export const sectionId = (heading: string) => slugify(heading)

export const guideHref = (slug: string) => `/host/guides/${slug}`

/** Product facts, as hosts need to hear them. Kept here so both hubs say the same thing. */
export const HOST_FACTS = [
  { big: '₹0', label: 'to list', detail: 'Listing an event on Gorave is free.' },
  { big: '2', label: 'free events a month', detail: 'Run up to 2 free-entry events every month. Free events are request-to-join.' },
  { big: '₹99', label: 'lowest paid ticket', detail: 'Paid tickets start at ₹99. You set the price.' },
  { big: '90%', label: 'is yours', detail: 'You keep 90% of the ticket price. Payouts go to your UPI or bank account.' },
  { big: '₹50', label: 'flat guest fee', detail: 'Guests pay a flat ₹50 platform fee on top of your price.' },
  { big: '10%', label: 'seats kept open', detail: 'Whatever crowd mix you choose, 10% of seats stay open.' },
  { big: '18+', label: 'phone-verified', detail: 'Every guest is phone-verified and 18+. Add an age gate if your night needs one.' },
  { big: 'QR', label: 'at the door', detail: 'Confirmed guests get a QR ticket, and you scan them in.' },
] as const

/** The night-before checklist; each item points to the guide that covers it. */
export const HOST_CHECKLIST = [
  { item: 'Capacity decided by walking the room', slug: 'how-to-throw-a-house-party' },
  { item: 'Crowd mix and age gate set', slug: 'setting-the-crowd-mix' },
  { item: 'Requests answered, waitlist checked', slug: 'setting-the-crowd-mix' },
  { item: 'Ticket price checked against real costs', slug: 'pricing-your-first-ticketed-event' },
  { item: 'Payout UPI or bank added', slug: 'pricing-your-first-ticketed-event' },
  { item: 'House rules written into the listing', slug: 'writing-house-rules-guests-follow' },
  { item: 'Neighbours told, society rules checked', slug: 'keeping-neighbours-happy' },
  { item: 'Water, ice, cups, garbage bags bought', slug: 'how-to-throw-a-house-party' },
  { item: 'Phone charged, door spot lit for QR check-in', slug: 'running-the-door-qr-check-in' },
] as const

export const GUIDES_FAQ = [
  { q: 'Does it cost anything to list an event?', a: 'No. Listing on Gorave is free, and you can run 2 free-entry events every month. On paid events you keep 90% of the ticket price, and guests pay a flat ₹50 platform fee on top.' },
  { q: 'What is the lowest I can charge?', a: 'Paid tickets start at ₹99. Above that you choose the price. Payouts go to your UPI ID or bank account.' },
  { q: 'Do I have to accept everyone who requests?', a: 'No. Free events are request-to-join: you accept or decline each request. A declined guest cannot request the same event again, and once you are full, new requests go on a waitlist.' },
  { q: 'Who sees my address?', a: 'Only guests you have confirmed. Everyone else sees the area, not the exact address.' },
  { q: 'How do guests get in on the night?', a: 'Each confirmed guest gets a QR ticket in the app, and you scan it at the door. Every guest is phone-verified and 18+.' },
  { q: 'Can I control the crowd mix?', a: 'Yes. Choose Open, 50:50, 60:40, women-only, men-only, or a custom split in 10% steps. 10% of seats always stay open, and you can add an age gate.' },
]

export const GUIDES_CRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Host', href: '/host' },
  { label: 'Guides', href: '/host/guides' },
]
