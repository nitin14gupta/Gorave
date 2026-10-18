import { CITIES, EVENT_TYPES } from './content'
import type { PhotoKey } from './media'

export interface MenuColumn {
  heading: string
  links: { label: string; href: string }[]
}

export interface MegaMenuDef {
  key: 'events' | 'cities'
  label: string
  columns: MenuColumn[]
  feature: { title: string; caption: string; href: string; photo: PhotoKey }
}

// Every link here is one of the SEO page templates from the site map.
export const MEGA_MENUS: MegaMenuDef[] = [
  {
    key: 'events',
    label: 'Events',
    columns: [
      { heading: 'By vibe', links: EVENT_TYPES.map(t => ({ label: t.label, href: `/${t.slug}` })) },
      {
        heading: 'When',
        links: [
          { label: 'Tonight', href: '/mumbai/tonight' },
          { label: 'Tomorrow', href: '/mumbai/tomorrow' },
          { label: 'This weekend', href: '/mumbai/this-weekend' },
          { label: 'This week', href: '/mumbai/this-week' },
          { label: "New Year's Eve", href: '/mumbai/new-years-eve' },
          { label: 'Holi', href: '/mumbai/holi' },
          { label: 'Diwali', href: '/mumbai/diwali' },
        ],
      },
      {
        heading: "Who it's for",
        links: [
          { label: 'Free events', href: '/mumbai/free-events' },
          { label: 'Under ₹500', href: '/mumbai/under-500' },
          { label: 'Women only', href: '/mumbai/women-only' },
          { label: 'Balanced crowd', href: '/mumbai/balanced-crowd' },
          { label: '21+ nights', href: '/mumbai/21-plus' },
          { label: '25+ nights', href: '/mumbai/25-plus' },
        ],
      },
    ],
    feature: { title: 'Sunset Rooftop Sessions', caption: 'Sat · Bandra West', href: '/mumbai/rooftop-parties', photo: 'roof1' },
  },
  {
    key: 'cities',
    label: 'Cities',
    columns: [
      { heading: 'Metros', links: CITIES.slice(0, 4).map(c => ({ label: c.name, href: `/${c.slug}` })) },
      { heading: 'More cities', links: CITIES.slice(4).map(c => ({ label: c.name, href: `/${c.slug}` })) },
      { heading: 'Mumbai hot spots', links: CITIES[0].areas.map(a => ({ label: a, href: `/mumbai/${a.toLowerCase().replace(/\s+/g, '-')}` })) },
    ],
    feature: { title: 'Mumbai this weekend', caption: 'Bandra · Khar · Andheri', href: '/mumbai/this-weekend', photo: 'roof2' },
  },
]

export const NAV_LINKS = [
  { label: 'Host', href: '/host' },
  { label: 'Guides', href: '/guides' },
  { label: 'Safety', href: '/safety' },
]

export const FOOTER_COLUMNS: MenuColumn[] = [
  { heading: 'Explore', links: [{ label: 'Tonight', href: '/tonight' }, { label: 'This weekend', href: '/this-weekend' }, { label: 'Women-only nights', href: '/women-only' }, { label: 'House parties', href: '/house-parties' }, { label: 'Going-out guides', href: '/guides' }, { label: 'All cities', href: '/cities' }] },
  { heading: 'Host', links: [{ label: 'Host on Gorave', href: '/host' }, { label: 'How payouts work', href: '/host/payouts' }, { label: 'Hosting guides', href: '/host/guides' }, { label: 'Badges', href: '/host/badges' }] },
  { heading: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Safety', href: '/safety' }, { label: 'Blog', href: '/blog' }] },
  { heading: 'Help', links: [{ label: 'Help centre', href: '/help' }, { label: 'Contact', href: 'mailto:support@gorave.in' }, { label: 'Terms', href: '/terms' }, { label: 'Privacy', href: '/privacy' }] },
]

// Store links are placeholders until the listings are live.
export const APP_LINKS = { ios: '#', android: '#' }
