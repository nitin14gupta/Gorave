-- Delete chat, Instagram style (Nov 3 2026). Safe to run more than once.
--
-- Deleting a chat erases it from your side only: everything up to that moment
-- disappears for you and the chat leaves your inbox. The other person keeps
-- their copy. If they message again, the chat returns with only the new
-- messages. Replaces conversations.hidden_by, which hid a chat for good.

BEGIN;

CREATE TABLE IF NOT EXISTS public.conversation_clears (
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  cleared_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT conversation_clears_pkey PRIMARY KEY (user_id, conversation_id),
  CONSTRAINT conversation_clears_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT conversation_clears_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE
);

-- Chats hidden the old way move across, so they can come back on a new message.
INSERT INTO public.conversation_clears (user_id, conversation_id)
SELECT unnest(hidden_by), id FROM public.conversations WHERE COALESCE(array_length(hidden_by, 1), 0) > 0
ON CONFLICT DO NOTHING;
UPDATE public.conversations SET hidden_by = '{}' WHERE COALESCE(array_length(hidden_by, 1), 0) > 0;

COMMIT;
