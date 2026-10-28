-- Ticket transfer + why people cancel (Oct 29 2026). Safe to run more than once.
--
-- Can't make it? A paid ticket can be passed to a friend once, any time
-- before the start (the 48h cancel cutoff doesn't apply). It's an offer
-- until the friend accepts; the sender's ticket keeps working until then.
-- On accept the friend gets a fresh QR, the old one stops working, and the
-- money stays with the buyer: if the host later cancels, the refund goes to
-- whoever paid (event_attendees.paid_by_user_id), never to the friend.

BEGIN;

CREATE TABLE IF NOT EXISTS public.ticket_transfers (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  event_id uuid NOT NULL,
  from_user_id uuid NOT NULL,
  -- Sent to a friend in chat: only they can accept. NULL: a link anyone can claim.
  to_user_id uuid,
  token text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  decided_at timestamp with time zone,
  accepted_by uuid,
  CONSTRAINT ticket_transfers_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_transfers_token_key UNIQUE (token),
  CONSTRAINT ticket_transfers_status_check CHECK (status IN ('pending', 'accepted', 'cancelled')),
  CONSTRAINT ticket_transfers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT ticket_transfers_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT ticket_transfers_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT ticket_transfers_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- One live offer per ticket.
CREATE UNIQUE INDEX IF NOT EXISTS ticket_transfers_one_pending
  ON public.ticket_transfers (event_id, from_user_id) WHERE status = 'pending';

ALTER TABLE public.event_attendees
  -- Who paid for this ticket (refunds go to them). NULL = the attendee did.
  ADD COLUMN IF NOT EXISTS paid_by_user_id uuid,
  -- Who handed it over, and how many hops it has made (max 1).
  ADD COLUMN IF NOT EXISTS transferred_from_user_id uuid,
  ADD COLUMN IF NOT EXISTS transfer_count smallint NOT NULL DEFAULT 0,
  -- Why a guest cancelled (from the "Can't make it?" sheet).
  ADD COLUMN IF NOT EXISTS cancel_reason text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_attendees_paid_by_user_id_fkey') THEN
    ALTER TABLE public.event_attendees ADD CONSTRAINT event_attendees_paid_by_user_id_fkey
      FOREIGN KEY (paid_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_attendees_cancel_reason_check') THEN
    ALTER TABLE public.event_attendees ADD CONSTRAINT event_attendees_cancel_reason_check
      CHECK (cancel_reason IS NULL OR cancel_reason IN ('plans_changed', 'unwell', 'date', 'price', 'other'));
  END IF;
END $$;

-- 'transferred': the ticket moved to a friend (this row's QR no longer works).
ALTER TABLE public.event_attendees DROP CONSTRAINT IF EXISTS event_attendees_status_chk;
ALTER TABLE public.event_attendees ADD CONSTRAINT event_attendees_status_chk
  CHECK (status IN ('going', 'waitlist', 'cancelled', 'requested', 'declined', 'expired', 'transferred'));

-- A ticket offer sent to a friend shows in chat as a card they can accept.
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_content_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_content_type_check
  CHECK (content_type = ANY (ARRAY['text', 'event', 'profile', 'image', 'voice', 'video', 'gif', 'ticket']));

COMMIT;
