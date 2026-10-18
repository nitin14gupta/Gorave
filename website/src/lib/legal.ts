import { LEGAL_PRIVACY } from './legal/privacy'
import { LEGAL_TERMS, LEGAL_REFUNDS } from './legal/terms'
import { LEGAL_GUIDELINES, LEGAL_HOST_AGREEMENT } from './legal/community'
import type { Crumb } from './seo'

// Legal pages (/terms, /privacy, /guidelines, /host-agreement, /refunds).
// Every product rule in here must match the server and the app; the app
// opens /terms and /privacy from sign-in and settings.

export type { LegalDoc, LegalSection } from './legal/entity'
export { LEGAL_ENTITY } from './legal/entity'
import type { LegalDoc } from './legal/entity'

export const LEGAL_DOCS: LegalDoc[] = [LEGAL_TERMS, LEGAL_PRIVACY, LEGAL_GUIDELINES, LEGAL_HOST_AGREEMENT, LEGAL_REFUNDS]
export const getLegalDoc = (slug: string) => LEGAL_DOCS.find(d => d.slug === slug)
export const legalHref = (slug: string) => `/${slug}`
export const legalCrumbs = (d: LegalDoc): Crumb[] => [
  { label: 'Home', href: '/' },
  { label: d.title, href: legalHref(d.slug) },
]
