// Shared types and company details for the legal documents (kept apart
// from legal.ts so the documents can import them without a cycle).

export interface LegalSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface LegalDoc {
  slug: 'terms' | 'privacy' | 'guidelines' | 'host-agreement' | 'refunds'
  title: string
  /** One-line description for meta and the doc switcher */
  line: string
  /** 3 to 5 plain-English bullets shown first */
  short: string[]
  sections: LegalSection[]
}

/**
 * Company details used across the documents. TO CONFIRM before launch:
 * the registered legal entity, address and grievance officer (required
 * for intermediaries under India’s IT Rules, 2021).
 */
export const LEGAL_ENTITY = {
  name: 'Gorave',
  email: 'support@gorave.in',
  grievanceEmail: 'support@gorave.in',
  grievanceOfficer: 'Grievance Officer, Gorave',
  jurisdiction: 'India',
  updated: '18 October 2026',
}
