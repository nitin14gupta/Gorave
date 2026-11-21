-- Hosts' deals: early-bird tickets (the first N at a lower price) and promo
-- codes (RIYA20: % or ₹ off). A ticket records how it was priced, so early-
-- bird spots can be counted and code uses tracked.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS early_bird_price_inr INT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS early_bird_count INT;

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  host_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  percent_off   INT CHECK (percent_off IS NULL OR (percent_off BETWEEN 5 AND 100)),
  amount_off    INT CHECK (amount_off IS NULL OR amount_off > 0),
  max_uses      INT CHECK (max_uses IS NULL OR max_uses > 0),
  uses          INT NOT NULL DEFAULT 0,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((percent_off IS NULL) <> (amount_off IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_event_code ON public.promo_codes (event_id, upper(code));

-- How a ticket was priced: NULL = full price, 'early_bird', 'promo'.
ALTER TABLE public.event_attendees ADD COLUMN IF NOT EXISTS pricing TEXT;
ALTER TABLE public.event_attendees ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS pricing TEXT;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL;

DO $$ BEGIN
  ALTER TABLE public.event_attendees ADD CONSTRAINT event_attendees_pricing_check CHECK (pricing IS NULL OR pricing IN ('early_bird', 'promo'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
