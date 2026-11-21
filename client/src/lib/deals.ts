import type { EventSummary } from '@/api/apiService'

/** Early bird is on and has spots left: its price and how many. Otherwise null. */
export function earlyBird(e: Pick<EventSummary, 'early_bird_price_inr' | 'early_bird_count' | 'early_bird_sold' | 'price_inr' | 'is_free'>) {
  if (e.is_free || !e.early_bird_price_inr || !e.early_bird_count) return null
  const left = e.early_bird_count - (e.early_bird_sold ?? 0)
  if (left <= 0 || e.early_bird_price_inr >= e.price_inr) return null
  return { price: e.early_bird_price_inr, left }
}

/** The price a guest would pay right now (before any code). */
export const priceNow = (e: Parameters<typeof earlyBird>[0]) => earlyBird(e)?.price ?? e.price_inr
