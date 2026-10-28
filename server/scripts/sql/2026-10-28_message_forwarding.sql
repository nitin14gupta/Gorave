-- Message forwarding, Instagram/WhatsApp style (Oct 28 2026). Safe to run more than once.
--
-- A forward is a server-side COPY of a message into another conversation:
-- the client sends only the source message id, never the content, so nobody
-- can forge a "forwarded" message. Media is not re-uploaded; the copy points
-- at the same stored file (unsend never deletes files, so copies stay valid).
--
-- forward_score: 0 = original, 1 = forwarded once, n = forwarded n hops from
--   the original. Shown as "Forwarded"; at 5+ the app says "Forwarded many
--   times" and the server allows only one chat at a time (WhatsApp's rule,
--   to slow down chain messages).
-- forwarded_from_id: internal link to the message it was copied from, for
--   moderation (tracing a reported chain). Never sent to clients, so a
--   forward never reveals who originally sent it.

BEGIN;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS forward_score smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS forwarded_from_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_forwarded_from_id_fkey') THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_forwarded_from_id_fkey
      FOREIGN KEY (forwarded_from_id) REFERENCES public.messages(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_forward_score_check') THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_forward_score_check CHECK (forward_score >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS messages_forwarded_from_idx
  ON public.messages (forwarded_from_id) WHERE forwarded_from_id IS NOT NULL;

COMMIT;
