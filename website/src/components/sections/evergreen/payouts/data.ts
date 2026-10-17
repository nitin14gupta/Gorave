import { PHOTOS, type SampleEvent } from '@/constants'
import type { AccordionItem } from '@/components/ui/Accordion'
import { HOST_FEES, inr } from '@/lib/host'

// Shared money rules and copy for both payouts variants. Every figure here
// comes from HOST_FEES; the ₹499 ticket is an example, never a forecast.

export const PAYOUT_CRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Host', href: '/host' },
  { label: 'Payouts', href: '/host/payouts' },
]

export const LINKS = {
  start: '/host',
  badges: '/host/badges',
  pricing: '/host/guides/pricing-your-first-ticketed-event',
  safety: '/safety',
  guides: '/host/guides',
} as const

/** The example ticket both stories follow. */
export const EXAMPLE_TICKET = 499

/** Rupees to two decimals, exact paise kept (₹449.10). */
export const paise = (n: number) => Math.round(n * 100) / 100

/** Receipt-style money, always two decimals. */
export const rs = (n: number) => `₹${paise(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Where one ticket's money goes. */
export function split(ticket: number) {
  const host = paise(ticket * HOST_FEES.hostShare)
  return {
    ticket,
    fee: HOST_FEES.platformFee,
    guestPays: ticket + HOST_FEES.platformFee,
    commission: paise(ticket - host),
    host,
  }
}

export const ONE = split(EXAMPLE_TICKET)

/** A real event's cover, or a stock party photo when there are none. */
const STOCK = ['party1', 'roof1', 'dine2', 'game1'] as const
export const cover = (events: SampleEvent[], i: number) => {
  const e = events.length ? events[i % events.length] : null
  return e ? (e.image ?? PHOTOS[e.photo]) : PHOTOS[STOCK[i % STOCK.length]]
}

/** Only real numbers above zero get shown. */
export function proofLine(stats: { upcoming: number; liveCities: number }) {
  const bits: string[] = []
  if (stats.upcoming > 0) bits.push(`${stats.upcoming.toLocaleString('en-IN')} upcoming events`)
  if (stats.liveCities > 0) bits.push(`${stats.liveCities} ${stats.liveCities === 1 ? 'city' : 'cities'} live`)
  return bits
}

export const PAYOUT_FAQ: AccordionItem[] = [
  {
    q: 'When do I get paid?',
    a: `After the event. Gorave collects the full ticket price when guests book, then automatically transfers your 90% to the UPI ID or bank account you've added. You don't have to request it.`,
  },
  {
    q: 'How much does Gorave take?',
    a: `10% of the ticket price, as commission. Listing an event is free, and there's nothing to pay upfront. On a ${inr(EXAMPLE_TICKET)} ticket you keep ${rs(ONE.host)}.`,
  },
  {
    q: `Who pays the ${inr(HOST_FEES.platformFee)} platform fee?`,
    a: `Guests do. It's a flat ${inr(HOST_FEES.platformFee)} added on top of the ticket at checkout, so it never comes out of your share. Guests pay with UPI (GPay, PhonePe and so on) or their Gorave Wallet.`,
  },
  {
    q: 'Where can my payouts go?',
    a: `Either a UPI ID, which the app verifies and shows you the account name for, or a bank account with the holder name, account number and IFSC (we look up the bank and branch for you). Your details are encrypted, and one UPI ID or bank account can be linked to only one Gorave account.`,
  },
  {
    q: 'What if I need to cancel?',
    a: `You can cancel up to 48 hours before the event, and every attendee gets an automatic full refund to their Gorave Wallet. Inside 48 hours, cancellation is blocked, so guests can count on the night happening.`,
  },
  {
    q: 'Do I have to charge for tickets?',
    a: `No. You can run up to ${HOST_FEES.freePerMonth} free-entry events a month. When you want to sell tickets, paid events start at ${inr(HOST_FEES.minTicket)}.`,
  },
]
