-- Chat production hardening (Oct 28 2026). Safe to run more than once.
--
-- client_id: the phone makes an id for every message before sending it and
--   reuses it on every retry. One (sender, client_id) pair is stored once, so
--   a retry after a dropped connection can never save the same message twice,
--   and the app knows exactly which waiting bubble the server's copy is.
-- delivered_at: set the first time the recipient's app loads the message
--   (their inbox, or the chat itself). Drives "Sent" -> "Delivered" -> "Seen".

BEGIN;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone;

CREATE UNIQUE INDEX IF NOT EXISTS messages_sender_client_id_key
  ON public.messages (sender_id, client_id) WHERE client_id IS NOT NULL;

-- Finding what still needs a "delivered" stamp stays cheap as the table grows.
CREATE INDEX IF NOT EXISTS messages_undelivered_idx
  ON public.messages (conversation_id) WHERE delivered_at IS NULL;

-- Anything already read was obviously delivered.
UPDATE public.messages SET delivered_at = read_at
WHERE delivered_at IS NULL AND read_at IS NOT NULL;

COMMIT;
