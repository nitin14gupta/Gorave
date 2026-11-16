"""Who other people can see. One place for the rules:

- A deleted or locked account doesn't exist to anyone else. Locks are
  undone on appeal, so they're filtered when reading, never by changing data:
  unlock and everything comes back (counts, lists, chats).
- Two people where either blocked the other don't see each other in lists,
  profiles or profile cards. Counts don't change for a block.

SQL fragments follow the style of ACTIVE_MEMBER (utils/event_chat.py) and
BLOCK_FILTER (utils/album.py): plain strings to drop into WHERE clauses.
"""
from typing import Optional


def live(alias: str) -> str:
    """The account isn't deleted or locked."""
    return f"(COALESCE({alias}.is_deleted, FALSE) = FALSE AND COALESCE({alias}.is_locked, FALSE) = FALSE)"


def gone(alias: str) -> str:
    """The opposite of live(), as a column: deleted or locked."""
    return f"(COALESCE({alias}.is_deleted, FALSE) OR COALESCE({alias}.is_locked, FALSE))"


def not_blocked(user_col: str, viewer: str) -> str:
    """Neither of them blocked the other. `viewer` is a placeholder or a literal,
    e.g. not_blocked('u.id', '%(me)s::uuid')."""
    return (
        f"NOT EXISTS (SELECT 1 FROM user_blocks ub WHERE "
        f"(ub.blocker_id = {viewer} AND ub.blocked_id = {user_col}) OR "
        f"(ub.blocker_id = {user_col} AND ub.blocked_id = {viewer}))"
    )


def blocked_ids(cur, uid: str) -> list:
    """Everyone this person blocked, and everyone who blocked them."""
    cur.execute(
        """
        SELECT blocked_id::text AS id FROM user_blocks WHERE blocker_id = %s::uuid
        UNION SELECT blocker_id::text FROM user_blocks WHERE blocked_id = %s::uuid
        """,
        (uid, uid),
    )
    return [r["id"] for r in cur.fetchall()]


def blocked_by_me_ids(cur, uid: str) -> set:
    cur.execute("SELECT blocked_id::text AS id FROM user_blocks WHERE blocker_id = %s::uuid", (uid,))
    return {r["id"] for r in cur.fetchall()}


def unavailable_ids(cur, viewer: str, user_ids: list) -> set:
    """Of these people, the ones the viewer can't see: deleted, locked, or a
    block either way. Never includes the viewer themselves."""
    ids = [i for i in {str(x) for x in user_ids if x} if i != viewer]
    if not ids:
        return set()
    cur.execute(
        f"""
        SELECT u.id::text AS id FROM users u
        WHERE u.id = ANY(%(ids)s::uuid[])
          AND (NOT {live('u')} OR NOT {not_blocked('u.id', '%(me)s::uuid')})
        """,
        {"ids": ids, "me": viewer},
    )
    return {r["id"] for r in cur.fetchall()}


def unavailable(cur, viewer: str, user_id: Optional[str]) -> bool:
    return bool(user_id) and user_id in unavailable_ids(cur, viewer, [user_id])
