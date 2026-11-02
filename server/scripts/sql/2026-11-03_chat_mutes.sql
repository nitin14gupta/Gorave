-- Muted 1:1 chats (Nov 3 2026). Safe to run more than once.
--
-- Each person mutes for themselves: no pushes from that chat, and unread counts
-- still work. Event chats keep their own conversation_members.muted.

BEGIN;

CREATE TABLE IF NOT EXISTS public.conversation_mutes (
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  muted_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT conversation_mutes_pkey PRIMARY KEY (user_id, conversation_id),
  CONSTRAINT conversation_mutes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT conversation_mutes_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE
);

COMMIT;
