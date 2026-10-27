/** How an event's crowd rule reads in a badge. */
export function crowdLabel(womenPct: number | null | undefined): string {
  if (womenPct == null) return 'Open crowd'
  if (womenPct >= 100) return 'Women only'
  if (womenPct <= 0) return 'Men only'
  return `${womenPct}:${100 - womenPct} W:M`
}
