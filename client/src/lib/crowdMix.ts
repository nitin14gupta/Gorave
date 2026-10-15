// Mirrors server/utils/seats.py — keep the two in sync. women_pct is the share
// of spots for women: null = open crowd, 100 = women only, 0 = men only.
// Mixed splits keep a small open pool anyone can take (incl. non-binary /
// prefer-not-to-say guests, who only ever use the open pool).

export const OPEN_POOL_PCT = 0.1

export interface CrowdSplit {
  women: number
  men: number
  open: number
}

export function crowdSplit(capacity: number, womenPct: number | null | undefined): CrowdSplit | null {
  if (womenPct == null) return null
  if (womenPct >= 100) return { women: capacity, men: 0, open: 0 }
  if (womenPct <= 0) return { women: 0, men: capacity, open: 0 }
  const open = Math.max(1, Math.round(capacity * OPEN_POOL_PCT))
  // Python's round() is banker's rounding — match it so previews agree.
  const raw = ((capacity - open) * womenPct) / 100
  const floor = Math.floor(raw)
  const diff = raw - floor
  const women = diff > 0.5 || (diff === 0.5 && floor % 2 === 1) ? floor + 1 : floor
  return { women, men: capacity - open - women, open }
}

export const CROWD_PRESETS: { key: string; label: string; value: number | null }[] = [
  { key: 'open', label: 'Open', value: null },
  { key: '50', label: '50:50', value: 50 },
  { key: '60', label: '60:40', value: 60 },
  { key: '40', label: '40:60', value: 40 },
  { key: 'women', label: 'Women only', value: 100 },
  { key: 'men', label: 'Men only', value: 0 },
]

/** Short badge label: "Women only", "60% women", or null for open. */
export function crowdLabel(womenPct: number | null | undefined): string | null {
  if (womenPct == null) return null
  if (womenPct >= 100) return 'Women only'
  if (womenPct <= 0) return 'Men only'
  return `${womenPct}:${100 - womenPct} W:M`
}

export type GenderBucket = 'women' | 'men' | 'other'

export function genderBucket(gender: string | null | undefined): GenderBucket {
  if (gender === 'Female') return 'women'
  if (gender === 'Male') return 'men'
  return 'other'
}
