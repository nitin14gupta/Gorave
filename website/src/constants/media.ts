// Photography used across the site. Unsplash for now, swap individual keys
// for Gorave's own event photos as they come in; nothing else has to change.

export const unsplash = (id: string) => `https://images.unsplash.com/${id}`

export const PHOTOS = {
  party1: unsplash('photo-1527529482837-4698179dc6ce'),
  party2: unsplash('photo-1530103862676-de8c9debad1d'),
  party3: unsplash('photo-1511795409834-ef04bbd61622'),
  roof1: unsplash('photo-1519671482749-fd09be7ccebf'),
  roof2: unsplash('photo-1492684223066-81342ee5ff30'),
  roof4: unsplash('photo-1516997121675-4c2d1684aa3e'),
  game1: unsplash('photo-1610890716171-6b1bb98ffd09'),
  dine1: unsplash('photo-1414235077428-338989a2e8c0'),
  dine2: unsplash('photo-1517457373958-b7bdd4587205'),
  dine3: unsplash('photo-1528605248644-14dd04022da1'),
  gig1: unsplash('photo-1493225457124-a3eb161ffa5f'),
  gig2: unsplash('photo-1514525253161-7a46d19cd819'),
  gig3: unsplash('photo-1524368535928-5b5e00ddc76b'),
  gig4: unsplash('photo-1506157786151-b8491531f063'),
  fr1: unsplash('photo-1529156069898-49953e39b3ac'),
  fr2: unsplash('photo-1529543544282-ea669407fca3'),
  fest: unsplash('photo-1501281668745-f7f57925c3b4'),
  neon: unsplash('photo-1496024840928-4c417adf211d'),
  drinks: unsplash('photo-1470337458703-46ad1756a187'),
  // Generated (OpenArt) scenes, local files, so never append ?w= query params to these.
  sceneDoor: '/img/areas/doorway.webp',
  sceneLiving: '/img/areas/livingroom.webp',
  sceneRoof: '/img/areas/rooftop.webp',
  sceneChai: '/img/areas/chai.webp',
  sceneBite: '/img/areas/latebite.webp',
} as const

export type PhotoKey = keyof typeof PHOTOS

/** The app's real invite templates (Cloudflare R2). */
export const templateImage = (name: string) =>
  `https://pub-f5cb81cf85a5471d9abf932f74d1ae0e.r2.dev/housepartyshowcase/${name}.webp`

export const AVATARS = [
  'photo-1494790108377-be9c29b29330',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1438761681033-6461ffad8d80',
  'photo-1500648767791-00dcc994a43e',
  'photo-1544005313-94ddf0286df2',
  'photo-1506794778202-cad84cf45f1d',
].map(unsplash)

export const BRAND = {
  logoDark: '/img/black-icon.png',
  logoLight: '/img/splash-icon.png',
  promoHost: '/img/hostXgorave.png',
  badges: {
    rising: '/img/rising.png',
    established: '/img/established.png',
    elite: '/img/elite.png',
    legend: '/img/legend.png',
  },
} as const
