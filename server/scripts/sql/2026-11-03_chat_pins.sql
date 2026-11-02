-- Pinned chats (Nov 3 2026). Safe to run more than once.
--
-- Each person pins chats for themselves, up to 3, like Instagram. A pin stays
-- at the top of your Chat list and nobody else can see it.

BEGIN;

CREATE TABLE IF NOT EXISTS public.conversation_pins (
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  pinned_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT conversation_pins_pkey PRIMARY KEY (user_id, conversation_id),
  CONSTRAINT conversation_pins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT conversation_pins_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE
);

COMMIT;
