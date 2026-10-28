-- What each ticket actually cost, and what was refunded (Oct 29 2026).
-- Safe to run more than once.
--
-- Until now refunds and host payouts were worked out from the event's
-- CURRENT price, so a price edit after sales changed both, and a host cancel
-- refunded only the ticket price (not the ₹50 platform fee). Each ticket now
-- carries its own numbers, frozen when it was bought:
--
-- price_paid_inr   the host's ticket price the guest paid
-- fee_paid_inr     the platform fee the guest paid (₹50)
-- commission_inr   Gorave's cut of price_paid_inr (the event's locked rate)
-- refund_amount_inr / refunded_at  set once, when money went back to the wallet
--
-- events.rescheduled_at: last time the date moved by more than 7 days. Paid
-- guests then get 48h from that moment to cancel for a full refund.

BEGIN;

ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS price_paid_inr integer,
  ADD COLUMN IF NOT EXISTS fee_paid_inr integer,
  ADD COLUMN IF NOT EXISTS commission_inr integer,
  ADD COLUMN IF NOT EXISTS refund_amount_inr integer,
  ADD COLUMN IF NOT EXISTS refunded_at timestamp with time zone,
  -- Fees Gorave kept from earlier tickets on this same row (cancel, then buy
  -- again reuses the row), so revenue still counts them.
  ADD COLUMN IF NOT EXISTS prior_fees_kept_inr integer NOT NULL DEFAULT 0;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS rescheduled_at timestamp with time zone;

-- Backfill tickets bought before this, best source first.
-- 1. Card / UPI: the payment order has the real total and fee.
UPDATE public.event_attendees ea
SET fee_paid_inr = po.platform_fee_inr,
    price_paid_inr = po.amount_inr - po.platform_fee_inr
FROM public.payment_orders po
WHERE ea.price_paid_inr IS NULL
  AND ea.payment_id IS NOT NULL AND ea.payment_id <> 'wallet'
  AND po.razorpay_payment_id = ea.payment_id
  AND po.status = 'paid';

-- 2. Anything else paid (wallet, or no order found): the event's snapshot.
UPDATE public.event_attendees ea
SET price_paid_inr = e.price_inr,
    fee_paid_inr = e.platform_fee_inr
FROM public.events e
WHERE ea.price_paid_inr IS NULL
  AND ea.event_id = e.id
  AND ea.payment_id IS NOT NULL
  AND e.price_inr > 0;

-- Commission at each event's locked rate, on what the ticket really cost.
UPDATE public.event_attendees ea
SET commission_inr = CASE WHEN e.price_inr > 0
                          THEN round(ea.price_paid_inr::numeric * e.host_commission_inr / e.price_inr)::int
                          ELSE 0 END
FROM public.events e
WHERE ea.commission_inr IS NULL AND ea.price_paid_inr IS NOT NULL AND ea.event_id = e.id;

-- Guests of events cancelled before this were already refunded the ticket
-- price (the old rule). Record that so they're never refunded a second time.
-- (Crediting them the ₹50 fee as well is a separate, deliberate decision.)
UPDATE public.event_attendees ea
SET refund_amount_inr = ea.price_paid_inr,
    refunded_at = COALESCE(e.updated_at, NOW())
FROM public.events e
WHERE ea.event_id = e.id AND e.is_cancelled
  AND ea.status = 'going' AND ea.payment_id IS NOT NULL
  AND ea.refunded_at IS NULL AND e.price_inr > 0;

COMMIT;
