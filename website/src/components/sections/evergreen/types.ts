import type { City, SampleEvent } from '@/constants'
import type { BadgeTier, SiteStats } from '@/lib/pagesData'

// Props for the four evergreen pages. Plain data only (client-safe).

/** /host/payouts: money rules are static (lib/host.ts HOST_FEES); stats for social proof. */
export interface PayoutsProps { stats: SiteStats; events: SampleEvent[] }

/** /host/badges: each tier with real hosts holding it right now. */
export interface BadgesProps { tiers: BadgeTier[]; stats: SiteStats }

/** /app: the download page every "Get the app" button lands on. */
export interface AppProps { events: SampleEvent[]; stats: SiteStats; cities: { city: City; count: number }[] }

/** /about: the Gorave story. */
export interface AboutProps { stats: SiteStats; cities: { city: City; count: number }[]; events: SampleEvent[] }

