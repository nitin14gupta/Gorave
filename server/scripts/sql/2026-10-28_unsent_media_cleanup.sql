-- Unsent photos, videos and voice notes get deleted from storage (Oct 28 2026).
-- Safe to run more than once.
--
-- Unsend now keeps the file's link/key on the (hidden) unsent row so the
-- cleanup job (utils/chat_media_purge.py) can delete the file. A forwarded
-- copy points at the same file, so the job only deletes a file once no live
-- message still uses it; these indexes keep that check fast.

CREATE INDEX IF NOT EXISTS messages_media_key_idx
  ON public.messages ((metadata->>'key')) WHERE metadata ? 'key';

CREATE INDEX IF NOT EXISTS messages_media_url_idx
  ON public.messages ((metadata->>'url'))
  WHERE content_type IN ('image', 'video', 'gif', 'voice') AND metadata ? 'url';

-- The job only ever looks at unsent media whose file hasn't been handled yet.
CREATE INDEX IF NOT EXISTS messages_unsent_media_idx
  ON public.messages (unsent_at)
  WHERE unsent_at IS NOT NULL AND media_purged_at IS NULL
    AND content_type IN ('image', 'video', 'gif', 'voice');
