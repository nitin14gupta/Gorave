"""Seed ~100 realistic upcoming events across every city and neighbourhood the
website covers, so the public pages show real API data in local dev.

Creates hosts, guests, attendees, a few past events with reviews (so host
ratings and badges are real numbers, not placeholders). Everything it creates
is tagged — usernames end in `_gx` and phones start with +91 70000 — so it can
be removed cleanly.

    python scripts/seed_website_demo.py          # seed (idempotent: cleans first)
    python scripts/seed_website_demo.py --clean  # remove everything it created

LOCAL DEV ONLY. Refuses to run unless DATABASE_URL points at localhost.
"""
import json
import os
import random
import sys
from datetime import datetime, timedelta, timezone

import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
DB = os.getenv("DATABASE_URL", "")
if "localhost" not in DB and "127.0.0.1" not in DB:
    sys.exit("Refusing to seed: DATABASE_URL is not a local database.")

TAG = "_gx"
PHONE_PREFIX = "70000"
rng = random.Random(42)

U = "https://images.unsplash.com/{}?w=1200&auto=format&fit=crop&q=70"
AVATARS = [
    "photo-1494790108377-be9c29b29330", "photo-1507003211169-0a1dd7228f2d", "photo-1438761681033-6461ffad8d80",
    "photo-1500648767791-00dcc994a43e", "photo-1544005313-94ddf0286df2", "photo-1506794778202-cad84cf45f1d",
    "photo-1534528741775-53994a69daeb", "photo-1531427186611-ecfd6d936c79", "photo-1517841905240-472988babdf9",
    "photo-1524504388940-b1c1722653e1", "photo-1539571696357-5a69c17a67c6", "photo-1488426862026-3ee34a7d66df",
]
COVERS = {
    "house_party": ["photo-1527529482837-4698179dc6ce", "photo-1530103862676-de8c9debad1d", "photo-1511795409834-ef04bbd61622"],
    "rooftop": ["photo-1519671482749-fd09be7ccebf", "photo-1492684223066-81342ee5ff30", "photo-1516997121675-4c2d1684aa3e"],
    "game_night": ["photo-1610890716171-6b1bb98ffd09", "photo-1632501641765-e568d28b0015", "photo-1606503153255-59d8b8b82176"],
    "dinner": ["photo-1414235077428-338989a2e8c0", "photo-1517457373958-b7bdd4587205", "photo-1528605248644-14dd04022da1"],
    "music": ["photo-1493225457124-a3eb161ffa5f", "photo-1514525253161-7a46d19cd819", "photo-1524368535928-5b5e00ddc76b"],
    "other": ["photo-1529156069898-49953e39b3ac", "photo-1529543544282-ea669407fca3", "photo-1501281668745-f7f57925c3b4"],
}

# city -> (lat, lng, [(area as hosts type it, website area name)])
CITIES = {
    "Mumbai": (19.076, 72.8777, ["Bandra West", "Khar West", "Andheri West", "Lower Parel", "Powai", "Juhu", "Worli", "Versova"]),
    "Bangalore": (12.9716, 77.5946, ["Indiranagar", "Koramangala", "HSR Layout", "Whitefield", "Jayanagar"]),
    "Delhi": (28.7041, 77.1025, ["Hauz Khas", "Connaught Place", "GK", "Saket", "Vasant Kunj"]),
    "Pune": (18.5204, 73.8567, ["Koregaon Park", "Baner", "Viman Nagar"]),
    "Hyderabad": (17.385, 78.4867, ["Jubilee Hills", "Banjara Hills"]),
    "Goa": (15.2993, 74.124, ["Anjuna", "Assagao", "Panjim"]),
    "Chennai": (13.0827, 80.2707, ["Adyar", "Besant Nagar"]),
    "Kolkata": (22.5726, 88.3639, ["Park Street", "Salt Lake"]),
}

TITLES = {
    "house_party": ["Retro Bollywood Night", "Housewarming Jam", "Neon Glow House Party", "90s Throwback Party", "Sunday Sundowner at Home", "Balcony Disco", "Monsoon House Party", "Playlist Potluck Party"],
    "rooftop": ["Sunset Rooftop Sessions", "Terrace Sundowners", "Rooftop Movie Night", "Skyline Acoustic Evening", "Golden Hour on the Terrace", "Rooftop Chai & Vinyl"],
    "game_night": ["Mafia & Momos", "Catan Night", "Codenames & Chai", "Poker Night (Play Money)", "Board Game Brunch", "Quiz Night at Home"],
    "dinner": ["Konkan Coastal Dinner", "Home-cooked Biryani Night", "Long-table Pasta Supper", "South Indian Thali Night", "Ramen at Mine", "Dumpling Making Dinner"],
    "music": ["Living-room Acoustic Set", "Open Mic at Home", "Jam Circle", "Unplugged Ghazal Evening", "Indie Songwriters Night", "Vinyl Listening Session"],
    "other": ["Clothes Swap Brunch", "Karaoke Night", "Garba Practice Night", "Plant Swap & Chai", "Paint & Sip at Home", "Book Club Potluck"],
}
DESCRIPTIONS = {
    "house_party": "A proper house party: good playlist, good people, shoes off at the door. BYOB, snacks on us. Come say hi even if you know no one.",
    "rooftop": "Golden hour on the terrace with a speaker, fairy lights and a view. Come early for the sunset, stay for the songs.",
    "game_night": "Board games, card games and friendly betrayal. Rules explained, beginners welcome, snacks provided.",
    "dinner": "A home-cooked dinner at one long table. Menu shared in the group chat after you're confirmed. Tell us about allergies.",
    "music": "Music up close in a living room. Cushions on the floor, phones down during sets, open jam at the end.",
    "other": "A small, friendly get-together at home. Bring a friend or come solo, everyone's new to someone.",
}
RULES = ["Shoes off at the door.", "No plus-ones without asking.", "Respect the neighbours after 11 PM.", "Phones down during rounds.", "BYOB, no glass on the terrace."]
FIRST_F = ["Ananya", "Riya", "Meera", "Isha", "Sana", "Tara", "Kavya", "Aditi", "Zoya", "Naina", "Pooja", "Diya"]
FIRST_M = ["Arjun", "Kabir", "Rohan", "Vikram", "Aman", "Dev", "Nikhil", "Karan", "Yash", "Aarav", "Siddharth", "Rahul"]
LAST = ["Sharma", "Iyer", "Mehta", "Kapoor", "Nair", "Reddy", "Desai", "Bose", "Khan", "Fernandes", "Rao", "Malhotra"]
REVIEW_BODIES = ["Best night out in ages.", "Host made everyone feel welcome.", "Great crowd, would go again.", "Lovely vibe and great food.", "Felt safe and had fun.", None]


def clean(cur):
    cur.execute(f"SELECT id FROM users WHERE username LIKE %s", (f"%{TAG}",))
    ids = [r[0] for r in cur.fetchall()]
    if not ids:
        return 0
    cur.execute("DELETE FROM event_reviews WHERE reviewer_id = ANY(%s::uuid[]) OR event_id IN (SELECT id FROM events WHERE host_id = ANY(%s::uuid[]))", (ids, ids))
    cur.execute("DELETE FROM event_attendees WHERE user_id = ANY(%s::uuid[]) OR event_id IN (SELECT id FROM events WHERE host_id = ANY(%s::uuid[]))", (ids, ids))
    cur.execute("DELETE FROM events WHERE host_id = ANY(%s::uuid[])", (ids,))
    cur.execute("DELETE FROM user_photos WHERE user_id = ANY(%s::uuid[])", (ids,))
    cur.execute("DELETE FROM users WHERE id = ANY(%s::uuid[])", (ids,))
    return len(ids)


def make_user(cur, n, gender, city):
    first = rng.choice(FIRST_F if gender == "Female" else FIRST_M)
    last = rng.choice(LAST)
    username = f"{first}{last}{n}".lower()[: 30 - len(TAG)] + TAG
    dob = datetime(1994 + rng.randint(0, 9), rng.randint(1, 12), rng.randint(1, 28)).date()
    lat, lng, _ = CITIES[city]
    cur.execute(
        """INSERT INTO users (phone, name, dob, gender, city, lat, lng, username, profile_complete, is_host_onboarding_finished, badges)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, TRUE, '{}') RETURNING id""",
        (f"{PHONE_PREFIX}{n:05d}", f"{first} {last}", dob, gender, city, lat, lng, username),
    )
    uid = cur.fetchone()[0]
    cur.execute("INSERT INTO user_photos (user_id, url, r2_path, position) VALUES (%s, %s, 'seed', 0)", (uid, U.format(rng.choice(AVATARS)).replace("w=1200", "w=600")))
    return uid, gender


def seed(cur):
    now = datetime.now(timezone.utc)
    n = 0
    hosts, guests = {}, {}
    for city in CITIES:
        hosts[city] = []
        for _ in range(4 if city in ("Mumbai", "Bangalore", "Delhi") else 2):
            n += 1
            hosts[city].append(make_user(cur, n, rng.choice(["Female", "Male"]), city)[0])
        guests[city] = []
        for _ in range(14):
            n += 1
            guests[city].append(make_user(cur, n, rng.choice(["Female", "Male"]), city))

    def add_event(host, city, area, etype, when, past=False):
        lat, lng, _ = CITIES[city]
        title = rng.choice(TITLES[etype])
        paid = etype in ("dinner", "rooftop", "music") and rng.random() < 0.65
        price = rng.choice([199, 299, 499, 799, 999, 1299]) if paid else 0
        cap = {"dinner": 12, "game_night": 16, "music": 30, "rooftop": 40}.get(etype, 25)
        women_pct = rng.choice([None, None, 50, 50, 60, 100])
        covers = [U.format(c) for c in rng.sample(COVERS[etype], 2)]
        cur.execute(
            """INSERT INTO events (host_id, title, description, rules, event_type, date_time, end_time, capacity, spots_left,
                   age_restriction, location_name, location_lat, location_lng, price_inr, cover_photos, city, area,
                   address_line1, join_mode, women_pct, platform_fee_inr)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
            (host, title, DESCRIPTIONS[etype], rng.choice(RULES), etype, when, when + timedelta(hours=4), cap, cap,
             rng.choice([18, 18, 18, 21, 25]), f"Flat {rng.randint(1, 40)}, {area}, {city}",
             lat + rng.uniform(-0.05, 0.05), lng + rng.uniform(-0.05, 0.05), price, json.dumps(covers), city, area,
             f"Flat {rng.randint(1, 40)}", "request" if price == 0 else "instant", women_pct, 50 if price else 0),
        )
        eid = cur.fetchone()[0]
        going = rng.sample(guests[city], k=min(len(guests[city]), rng.randint(3, min(12, cap - 1))))
        for gid, _g in going:
            cur.execute("INSERT INTO event_attendees (event_id, user_id, status) VALUES (%s, %s, 'going') ON CONFLICT DO NOTHING", (eid, gid))
        cur.execute("UPDATE events SET spots_left = capacity - %s WHERE id = %s", (len(going), eid))
        if past:
            for gid, _g in rng.sample(going, k=min(len(going), rng.randint(2, 5))):
                cur.execute("INSERT INTO event_reviews (event_id, reviewer_id, rating, body) VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING",
                            (eid, gid, rng.choice([4, 5, 5, 5, 4, 3]), rng.choice(REVIEW_BODIES)))
        return eid

    upcoming = 0
    types = list(TITLES)
    for city, (_, _, areas) in CITIES.items():
        for area in areas:
            for _ in range(3):  # three upcoming nights per neighbourhood
                when = (now + timedelta(days=rng.randint(0, 20))).replace(hour=rng.choice([12, 13, 14, 15]), minute=rng.choice([0, 30]), second=0, microsecond=0)
                add_event(rng.choice(hosts[city]), city, area, rng.choice(types), when)
                upcoming += 1
        # A little history per host so ratings and badges are real.
        for h in hosts[city]:
            for _ in range(rng.randint(1, 9)):
                when = now - timedelta(days=rng.randint(5, 120))
                add_event(h, city, rng.choice(areas), rng.choice(types), when, past=True)
    return n, upcoming


if __name__ == "__main__":
    conn = psycopg2.connect(DB)
    try:
        with conn, conn.cursor() as cur:
            removed = clean(cur)
            print(f"removed {removed} seeded users (and their events)")
            if "--clean" not in sys.argv:
                users, upcoming = seed(cur)
                print(f"seeded {users} users and {upcoming} upcoming events across {len(CITIES)} cities")
    finally:
        conn.close()
