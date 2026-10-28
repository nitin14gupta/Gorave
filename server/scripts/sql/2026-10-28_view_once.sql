-- View once / view twice photos and videos, WhatsApp/Instagram style (Oct 28 2026).
-- Safe to run more than once.
--
-- view_limit: NULL = keep in chat (normal), 1 = view once, 2 = view twice.
--   The file's link is never sent with the message, to anyone. The recipient
--   gets a short-lived link only from POST /chat/messages/{id}/view, which
--   counts the open. The sender can't open it either.
-- views_used / first_viewed_at / last_viewed_at: how many opens are spent.
-- media_purged_at: the file was deleted from storage, a few minutes after
--   the last view or 14 days after sending if never opened
--   (utils/chat_media_purge.py).

BEGIN;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS view_limit smallint,
  ADD COLUMN IF NOT EXISTS views_used smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_viewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_viewed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS media_purged_at timestamp with time zone;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_view_limit_check') THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_view_limit_check CHECK (view_limit IS NULL OR view_limit IN (1, 2));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_views_used_check') THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_views_used_check CHECK (views_used >= 0 AND (view_limit IS NULL OR views_used <= view_limit));
  END IF;
END $$;

-- The cleanup job only ever looks at limited media that still has a file.
CREATE INDEX IF NOT EXISTS messages_limited_media_idx
  ON public.messages (sent_at) WHERE view_limit IS NOT NULL AND media_purged_at IS NULL;

COMMIT;
