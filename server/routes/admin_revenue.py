from datetime import date, timedelta
from fastapi import APIRouter, Query, Depends

from db.config import get_db
from middleware.admin_auth import get_current_admin

router = APIRouter(prefix="/admin/revenue", tags=["admin-revenue"])

DAYS_BACK = 30

# Revenue is counted per ticket, from what each ticket really cost
# (event_attendees.price_paid_inr / fee_paid_inr / commission_inr, frozen at
# purchase), never from the event's current price:
# - Platform fee: what guests paid, minus any fee given back. A host or admin
#   cancel refunds the fee; a guest's own cancel keeps it, so it still counts.
# - Commission: only on tickets that still stand (going, not refunded, event
#   not cancelled), because that's the only money the host is paid out from.
_FEE_KEPT = "(ea.fee_paid_inr - GREATEST(0, COALESCE(ea.refund_amount_inr, 0) - ea.price_paid_inr) + ea.prior_fees_kept_inr)"
_TICKET_STANDS = "(ea.status = 'going' AND ea.refunded_at IS NULL AND e.is_cancelled = FALSE)"
_REVENUE_JOIN = """
    FROM event_attendees ea
    JOIN events e ON e.id = ea.event_id
    WHERE ea.price_paid_inr IS NOT NULL
"""


def _fill_days(rows: list[dict], value_keys: list[str]) -> list[dict]:
    by_day = {r["day"].isoformat(): r for r in rows}
    today = date.today()
    out = []
    for i in range(DAYS_BACK - 1, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        row = by_day.get(d)
        out.append({"day": d, **{k: (row[k] if row else 0) for k in value_keys}})
    return out


# ── GET /admin/revenue/stats ───────────────────────────────────────────────────

@router.get("/stats")
def revenue_stats(current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, _):
        cur.execute(
            f"""
            SELECT
                COALESCE(SUM({_FEE_KEPT}), 0)::int AS total_platform_fee,
                COALESCE(SUM(ea.commission_inr) FILTER (WHERE {_TICKET_STANDS}), 0)::int AS total_host_commission
            {_REVENUE_JOIN}
            """
        )
        row = cur.fetchone()

    total_platform_fee = row["total_platform_fee"]
    total_host_commission = row["total_host_commission"]
    return {
        "total_platform_fee": total_platform_fee,
        "total_host_commission": total_host_commission,
        "total_revenue": total_platform_fee + total_host_commission,
    }


# ── GET /admin/revenue/by-day ──────────────────────────────────────────────────

@router.get("/by-day")
def revenue_by_day(current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, _):
        cur.execute(
            f"""
            SELECT
                ea.joined_at::date AS day,
                COALESCE(SUM({_FEE_KEPT}), 0)::int AS platform_fee,
                COALESCE(SUM(ea.commission_inr) FILTER (WHERE {_TICKET_STANDS}), 0)::int AS host_commission
            {_REVENUE_JOIN}
              AND ea.joined_at > NOW() - INTERVAL '30 days'
            GROUP BY day
            """
        )
        rows = cur.fetchall()

    return _fill_days(rows, ["platform_fee", "host_commission"])


# ── GET /admin/revenue/hosts ───────────────────────────────────────────────────

@router.get("/hosts")
def host_payout_ledger(
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    current_admin: dict = Depends(get_current_admin),
):
    offset = (page - 1) * page_size
    filters = ["ea.price_paid_inr > 0", _TICKET_STANDS]
    params: list = []
    if q:
        filters.append("(u.name ILIKE %s OR u.phone ILIKE %s)")
        like = f"%{q}%"
        params.extend([like, like])
    where = " AND ".join(filters)

    with get_db() as (cur, _):
        cur.execute(
            f"""
            SELECT COUNT(*)::int AS count FROM (
                SELECT u.id
                FROM users u
                JOIN events e ON e.host_id = u.id
                JOIN event_attendees ea ON ea.event_id = e.id
                LEFT JOIN host_payout_details hpd ON hpd.user_id = u.id
                WHERE {where}
                GROUP BY u.id
            ) sub
            """,
            params,
        )
        total = cur.fetchone()["count"]

        cur.execute(
            f"""
            SELECT
                u.id::text AS host_id, u.name AS host_name, u.phone AS host_phone,
                hpd.payout_method, (hpd.id IS NOT NULL) AS has_payout_details,
                COUNT(DISTINCT e.id)::int AS paid_events_count,
                COALESCE(SUM(ea.price_paid_inr), 0)::int AS gross_ticket_revenue,
                COALESCE(SUM(ea.commission_inr), 0)::int AS commission_taken
            FROM users u
            JOIN events e ON e.host_id = u.id
            JOIN event_attendees ea ON ea.event_id = e.id
            LEFT JOIN host_payout_details hpd ON hpd.user_id = u.id
            WHERE {where}
            GROUP BY u.id, u.name, u.phone, hpd.payout_method, hpd.id
            ORDER BY gross_ticket_revenue DESC
            LIMIT %s OFFSET %s
            """,
            [*params, page_size, offset],
        )
        rows = cur.fetchall()

    items = [
        {**r, "net_payable": r["gross_ticket_revenue"] - r["commission_taken"]}
        for r in rows
    ]
    return {"items": items, "total": total, "page": page, "page_size": page_size}


# ── GET /admin/revenue/leaderboard ─────────────────────────────────────────────

@router.get("/leaderboard")
def leaderboard(current_admin: dict = Depends(get_current_admin)):
    with get_db() as (cur, _):
        cur.execute(
            """
            SELECT
                u.id::text AS host_id, u.name AS host_name,
                COUNT(DISTINCT e.id)::int AS paid_events_count,
                COALESCE(SUM(ea.price_paid_inr), 0)::int AS gross_ticket_revenue,
                COALESCE(SUM(ea.commission_inr), 0)::int AS commission_taken
            FROM users u
            JOIN events e ON e.host_id = u.id AND e.is_cancelled = FALSE
            JOIN event_attendees ea ON ea.event_id = e.id AND ea.status = 'going'
                AND ea.price_paid_inr > 0 AND ea.refunded_at IS NULL
            GROUP BY u.id, u.name
            ORDER BY gross_ticket_revenue DESC
            LIMIT 10
            """
        )
        top_hosts = [
            {**r, "net_payable": r["gross_ticket_revenue"] - r["commission_taken"]}
            for r in cur.fetchall()
        ]

        cur.execute(
            """
            SELECT e.id::text, e.title, u.name AS host_name,
                   COUNT(ea.id)::int AS attendee_count, e.capacity
            FROM events e
            JOIN users u ON u.id = e.host_id
            JOIN event_attendees ea ON ea.event_id = e.id AND ea.status = 'going'
            WHERE e.is_cancelled = FALSE
            GROUP BY e.id, e.title, u.name, e.capacity
            ORDER BY attendee_count DESC
            LIMIT 10
            """
        )
        top_events_by_attendance = cur.fetchall()

        cur.execute(
            """
            SELECT e.id::text, e.title, u.name AS host_name,
                   ROUND(AVG(er.rating)::numeric, 1) AS avg_rating, COUNT(er.id)::int AS review_count
            FROM events e
            JOIN users u ON u.id = e.host_id
            JOIN event_reviews er ON er.event_id = e.id
            WHERE e.is_cancelled = FALSE
            GROUP BY e.id, e.title, u.name
            ORDER BY avg_rating DESC, review_count DESC
            LIMIT 10
            """
        )
        top_events_by_rating = cur.fetchall()

    return {
        "top_hosts": top_hosts,
        "top_events_by_attendance": top_events_by_attendance,
        "top_events_by_rating": top_events_by_rating,
    }
