-- Refunds: money a guest gets back is theirs. It lands in the Gorave Wallet
-- instantly and never expires, and the guest can send the card/UPI part back
-- to the original payment method instead (Razorpay refund on that payment).

-- Refund money never expires (only free promo credit may, if we ever give it).
UPDATE public.wallet_transactions SET expires_at = NULL WHERE source = 'event_refund' AND expires_at IS NOT NULL;

-- Where a refund can go back to.
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS payment_id TEXT;           -- Razorpay payment it came from
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS to_source_inr INT;         -- how much of it can go back (the card/UPI part)
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS to_source_until TIMESTAMPTZ; -- gateway's refund window
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS to_source_status TEXT;     -- NULL = still in wallet; processing | done | failed
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS to_source_refund_id TEXT;  -- Razorpay refund id
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS to_source_at TIMESTAMPTZ;
ALTER TABLE public.wallet_transactions ADD COLUMN IF NOT EXISTS choice_made_at TIMESTAMPTZ; -- they picked (kept in wallet or sent back)

DO $$ BEGIN
  ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_to_source_status_check
    CHECK (to_source_status IS NULL OR to_source_status IN ('processing', 'done', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_wallet_tx_payment ON public.wallet_transactions (payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallet_tx_refund_event ON public.wallet_transactions (user_id, reference_id) WHERE source = 'event_refund';

-- A refund sent back to the card/UPI it came from leaves the wallet as its own line.
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_source_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_source_check
  CHECK (source IN ('event_refund', 'ticket_purchase', 'bank_refund_request', 'refund_to_source'));
