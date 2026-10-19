import type { MetadataRoute } from 'next'
import { APP_IDS } from '@/constants/nav'

// Installable site + a pointer to the real app. With
// prefer_related_applications, Android Chrome offers the Play Store app
// instead of installing the website.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gorave: house parties, rooftops & game nights',
    short_name: 'Gorave',
    description: 'House parties, rooftops, game nights and dinners hosted by real people in your city.',
    id: '/',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f1e9d8',
    theme_color: '#f1e9d8',
    categories: ['social', 'lifestyle', 'entertainment', 'events'],
    lang: 'en-IN',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Tonight', url: '/tonight', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Free events', url: '/free-events', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'Host a night', url: '/host', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
    related_applications: [
      { platform: 'play', id: APP_IDS.android, url: `https://play.google.com/store/apps/details?id=${APP_IDS.android}` },
      ...(APP_IDS.appStoreId ? [{ platform: 'itunes', url: `https://apps.apple.com/app/id${APP_IDS.appStoreId}` }] : []),
    ],
    prefer_related_applications: true,
  }
}
