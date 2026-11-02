-- Event group chat (Nov 3 2026). Safe to run more than once.
--
-- One chat per event for confirmed guests and the host. Group chats live in
-- the same conversations and messages tables as 1:1 chats, with user1_id and
-- user2_id empty, so every query that looks up a pair of people skips them.

BEGIN;

ALTER TABLE public.conversations ALTER COLUMN user1_id DROP NOT NULL;
ALTER TABLE public.conversations ALTER COLUMN user2_id DROP NOT NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS kind text DEFAULT 'direct' NOT NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS event_id uuid;
-- "Only host can post".
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS posting_locked boolean DEFAULT false NOT NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS pinned_message_id uuid;
-- Which automatic lines have gone out ("starts in an hour", "album is open").
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS moments text[] DEFAULT '{}' NOT NULL;

ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_kind_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_kind_check CHECK (
  (kind = 'direct' AND user1_id IS NOT NULL AND user2_id IS NOT NULL)
  OR (kind = 'event' AND event_id IS NOT NULL AND user1_id IS NULL AND user2_id IS NULL)
);
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_event_id_fkey;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS conversations_event_unique ON public.conversations (event_id) WHERE event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'guest' NOT NULL,
  joined_at timestamp with time zone DEFAULT now() NOT NULL,
  -- Cancelled or passed on their ticket. Comes back if they rebook.
  left_at timestamp with time zone,
  -- Removed by the host. Stays out, even if their ticket is still good.
  removed_at timestamp with time zone,
  last_read_at timestamp with time zone DEFAULT now() NOT NULL,
  last_pushed_at timestamp with time zone,
  muted boolean DEFAULT false NOT NULL,
  CONSTRAINT conversation_members_pkey PRIMARY KEY (conversation_id, user_id),
  CONSTRAINT conversation_members_role_check CHECK (role IN ('host', 'guest')),
  CONSTRAINT conversation_members_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT conversation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS conversation_members_user_idx ON public.conversation_members (user_id);

ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_content_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_content_type_check CHECK (content_type = ANY (ARRAY[
  'text', 'event', 'profile', 'image', 'voice', 'video', 'gif', 'ticket', 'system', 'update'
]));

-- Chats for events that are still ahead, or ended inside the last day.
INSERT INTO public.conversations (kind, event_id, status)
SELECT 'event', e.id, 'active' FROM public.events e
WHERE e.is_published = TRUE AND e.is_cancelled = FALSE
  AND COALESCE(e.end_time, e.date_time + INTERVAL '6 hours') + INTERVAL '24 hours' > NOW()
ON CONFLICT (event_id) WHERE event_id IS NOT NULL DO NOTHING;

INSERT INTO public.conversation_members (conversation_id, user_id, role)
SELECT c.id, e.host_id, 'host' FROM public.conversations c JOIN public.events e ON e.id = c.event_id
ON CONFLICT DO NOTHING;

INSERT INTO public.conversation_members (conversation_id, user_id)
SELECT c.id, ea.user_id FROM public.conversations c
JOIN public.event_attendees ea ON ea.event_id = c.event_id
WHERE ea.status = 'going' AND ea.refunded_at IS NULL
ON CONFLICT DO NOTHING;

COMMIT;
