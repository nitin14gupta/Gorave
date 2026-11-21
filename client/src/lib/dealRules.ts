// Mirrors server/utils/pricing.py: deals stay deals, and the full price stays believable.
export const MAX_OFF_PCT = 50
export const COMP_MAX_USES = 10

/** Lowest early-bird price: half the full price, never under ₹49. */
export const earlyBirdFloor = (price: number) => Math.max(49, Math.ceil(price * (100 - MAX_OFF_PCT) / 100))

/** Most early-bird spots: half the capacity. */
export const earlyBirdMaxSpots = (capacity: number) => Math.max(1, Math.floor(capacity / 2))
