// city.jsx — City page, a different structure from home. Same tokens.
// Signature pieces:
//   · PosterStack  — Partiful-style 3D perspective line of posters; scroll
//                    slides it, hover lifts one card out and spreads the rest
//   · AreaReveal   — giant centred area names; hover slides posters out from
//                    behind the active name on both sides, leave tucks them away
//   · TonightBoard — departure-board list with a day strip + cursor poster
//   · VibePanels   — horizontal accordion that expands on hover
// Canvas conventions: no imports, inline styles, window exports.

const { useState, useRef, useEffect, useMemo } = React;

// ── Scroll progress for any element (works inside the canvas page view,
// whose scroller isn't window, by reading viewport-relative rects) ──
const useScrollProgress = (ref) => {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const v = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        setP(prev => (Math.abs(prev - v) > 0.001 ? v : prev));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return p;
};

const EASE = 'cubic-bezier(.2,.8,.2,1)';

// ── Posters — real invite templates + photo flyers + type flyers ──────
const POSTERS = [
  { kind: 'template', name: 'retro' },
  { kind: 'photo', photo: 'party1', title: 'house party', sub: 'Khar · Sat 9 PM', ink: '#fff' },
  { kind: 'type', bg: '#C8F25C', title: 'game\nnight', sub: 'Andheri · Fri', ink: '#171310' },
  { kind: 'template', name: 'nightout' },
  { kind: 'photo', photo: 'roof1', title: 'ROOFTOP', sub: 'Bandra · sunset', ink: '#fff', big: true },
  { kind: 'type', bg: '#FF3864', title: 'retro\nbolly\nwood', sub: 'Juhu · Sun', ink: '#FFF1E6' },
  { kind: 'template', name: 'houseparty' },
  { kind: 'photo', photo: 'dine2', title: 'supper club', sub: 'Lower Parel · Tue', ink: '#fff' },
  { kind: 'type', bg: '#171310', title: 'silent\ndisco', sub: 'Worli · Sat', ink: '#FF6B35' },
  { kind: 'template', name: 'beack' },
  { kind: 'photo', photo: 'gig3', title: 'LOFT GIG', sub: 'Versova · Thu', ink: '#fff', big: true },
  { kind: 'type', bg: '#DCE6F2', title: 'mafia &\nmomos', sub: 'Chembur · Fri', ink: '#131E2A' },
  { kind: 'template', name: 'halloween' },
  { kind: 'photo', photo: 'drinks', title: "girls' night", sub: 'Juhu · women only', ink: '#fff' },
  { kind: 'type', bg: '#FFB830', title: 'garba\nnight', sub: 'Goregaon · Sat', ink: '#2B1418' },
  { kind: 'template', name: 'christmas' },
];

// Same poster set for every city; only the area in the subtitle changes.
const cityPosters = (city) => POSTERS.map((p, i) => p.sub ? { ...p, sub: `${city.areas[i % city.areas.length]} · ${p.sub.split(' · ')[1]}` } : p);

const Poster = ({ p, w = 220, h = 290, radius = 16 }) => {
  const base = { width: w, height: h, borderRadius: radius, overflow: 'hidden', position: 'relative', flexShrink: 0, background: '#ddd' };
  if (p.kind === 'template') {
    return <div style={base}><img src={R2(p.name)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></div>;
  }
  if (p.kind === 'photo') {
    return (
      <div style={base}>
        <img src={img(p.photo, 500)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.05) 30%, rgba(0,0,0,.65))' }} />
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, color: p.ink }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: p.big ? w * 0.2 : w * 0.13, lineHeight: .9, letterSpacing: '-0.04em' }}>{p.title}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, marginTop: 6, opacity: .85 }}>{p.sub}</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ ...base, background: p.bg, color: p.ink, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .7 }}>gorave presents</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: w * 0.19, lineHeight: .86, letterSpacing: '-0.05em', whiteSpace: 'pre-line' }}>{p.title}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11 }}>{p.sub}</div>
    </div>
  );
};

// ── 01 · Hero — the city name IS the image ───────────────────────────
const useIstClock = () => {
  const fmt = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const [t, setT] = useState(fmt);
  useEffect(() => { const id = setInterval(() => setT(fmt()), 15000); return () => clearInterval(id); }, []);
  return t;
};

const CityHeroX = ({ city }) => {
  const ref = useRef(null);
  const p = useScrollProgress(ref);
  const time = useIstClock();
  return (
    <section ref={ref} style={{ position: 'relative', background: 'var(--cream)', padding: '130px 0 0', overflow: 'hidden' }}>
      <FloatingNav active="Cities" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 80px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--ink-2)' }}>
        <span>Home / Cities / <span style={{ color: 'var(--ink)' }}>{city.name}</span></span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--coral)', animation: 'gr-pulse 2s infinite' }} />
          {time} IST in {city.name}
        </span>
      </div>

      {/* The name, filled with a slowly panning photo */}
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: Math.min(330, 1900 / city.name.length), lineHeight: .8, letterSpacing: '-0.075em',
        textAlign: 'center', margin: '44px 0 0', textTransform: 'uppercase',
        backgroundImage: `url(${img(city.photo, 1800)})`, backgroundSize: '130% auto', backgroundPosition: `${30 + p * 60}% ${40 + p * 30}%`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        transform: `translateY(${p * -60}px)`,
      }}>{city.name}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'end', gap: 40, padding: '34px 80px 46px' }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 20, lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: 420 }}>
          Living rooms, rooftops and long tables across {city.name}. Hosted by people, not venues.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn size="lg">See tonight</Btn>
          <Btn kind="ghost" size="lg">Host in {city.name}</Btn>
        </div>
        <div style={{ textAlign: 'right', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 28, color: 'var(--orange)' }}>{city.coords}</div>
      </div>

      {/* Area ticker */}
      <div style={{ borderTop: '1.5px solid var(--ink)', borderBottom: '1.5px solid var(--ink)', padding: '16px 0', background: 'var(--cream)' }}>
        <Marquee speed={40} gap={0}>
          {[...city.areas, ...city.areas].map((a, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', padding: '0 26px', whiteSpace: 'nowrap' }}>
              {a}<span className="gr-grad-text" style={{ marginLeft: 52, fontSize: 18 }}>●</span>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
};

// ── 02 · PosterStack — 3D perspective line; scroll slides, hover pops ──
const PosterStack = ({ city }) => {
  const ref = useRef(null);
  const p = useScrollProgress(ref);
  const [hover, setHover] = useState(null);
  const posters = useMemo(() => cityPosters(city), [city]);
  const STEP = 118, W = 230, H = 300;
  return (
    <section ref={ref} style={{ position: 'relative', background: 'var(--paper)', height: 860, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 80, top: 150, zIndex: 40, maxWidth: 520, pointerEvents: 'none' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 84, lineHeight: .92, letterSpacing: '-0.055em', color: 'var(--ink)' }}>A million reasons<br />to go out.</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 19, color: 'var(--ink-2)', marginTop: 14 }}>Hover a poster. Every one is a real night in {city.name}.</div>
      </div>
      <div style={{ position: 'absolute', inset: 0, perspective: 1500, perspectiveOrigin: '30% 40%' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, transformStyle: 'preserve-3d', transform: `translateX(${360 - p * 900}px)` }}>
          {posters.map((poster, i) => {
            const isHover = hover === i;
            const spread = hover !== null && i > hover ? 150 : 0;
            const x = i * STEP + spread;
            const y = 470 - i * 24;
            return (
              <div
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{
                  position: 'absolute', left: x, top: y, width: W, height: H, cursor: 'pointer',
                  transformStyle: 'preserve-3d', zIndex: isHover ? 100 : i,
                  transform: isHover
                    ? 'translateZ(160px) translateY(-110px) rotateY(-4deg) rotateZ(-3deg) scale(1.12)'
                    : 'rotateY(-42deg) rotateX(4deg)',
                  transition: `transform .55s ${EASE}, left .55s ${EASE}`,
                  boxShadow: isHover ? '0 50px 80px -30px rgba(23,19,16,.6)' : '0 20px 40px -24px rgba(23,19,16,.45)',
                  borderRadius: 16,
                }}
              >
                <Poster p={poster} w={W} h={H} />
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: -44, textAlign: 'center',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--ink)',
                  opacity: isHover ? 1 : 0, transform: `translateY(${isHover ? 0 : -8}px)`, transition: `all .4s ${EASE}`,
                }}>Request to join →</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ── 03 · TonightBoard — departure board with day strip + cursor poster ──
const BOARD = [
  { t: '18:00', title: 'Sunset Rooftop Sessions', area: 'Bandra West', vibe: 'Rooftop', price: '₹799', status: 'Book', p: 4 },
  { t: '19:00', title: "Girls' Night: Wine & Paint", area: 'Juhu', vibe: 'Women only', price: 'Free', status: 'Request', p: 13 },
  { t: '20:00', title: 'Midnight Board Game Café', area: 'Andheri West', vibe: 'Game night', price: 'Free', status: 'Request', p: 2 },
  { t: '20:00', title: 'Indie Gig at the Loft', area: 'Versova', vibe: 'Gig', price: '₹499', status: 'Few left', p: 10 },
  { t: '21:00', title: 'Bollywood Retro Night', area: 'Khar West', vibe: 'House party', price: 'Free', status: 'Request', p: 5 },
  { t: '22:00', title: 'Silent Disco on the Terrace', area: 'Worli', vibe: 'Rooftop', price: '₹599', status: 'Book', p: 8 },
];
const DAYS = ['Today', 'Fri 17', 'Sat 18', 'Sun 19', 'Mon 20', 'Tue 21', 'Wed 22'];

const TonightBoard = ({ city }) => {
  const [day, setDay] = useState(0);
  const [row, setRow] = useState(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const boxRef = useRef(null);
  const rows = useMemo(
    () => BOARD.map((r, i) => ({ ...r, area: city.areas[i % city.areas.length] }))
      .slice(day % 2, BOARD.length - (day % 3 === 2 ? 1 : 0)),
    [day, city],
  );
  return (
    <section style={{ background: 'var(--noir)', color: 'var(--noir-ink)', padding: '120px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
          <Eyebrow dark>This week in {city.name}</Eyebrow>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 84, letterSpacing: '-0.055em', lineHeight: .92, marginTop: 14 }}>Now boarding.</div>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: 6, borderRadius: 999, background: 'var(--noir-2)' }}>
          {DAYS.map((d, i) => (
            <button key={d} onClick={() => setDay(i)} style={{
              border: 'none', cursor: 'pointer', padding: '10px 16px', borderRadius: 999, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13,
              background: day === i ? 'var(--noir-ink)' : 'transparent', color: day === i ? 'var(--ink)' : 'var(--noir-ink-2)', transition: `all .3s ${EASE}`,
            }}>{d}</button>
          ))}
        </div>
      </div>

      <div
        ref={boxRef}
        style={{ position: 'relative' }}
        onMouseMove={e => { const r = boxRef.current.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
        onMouseLeave={() => setRow(null)}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1.6fr 1fr 1fr 120px 150px', padding: '0 24px 12px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--noir-ink-2)' }}>
          <span>Time</span><span>Event</span><span>Area</span><span>Vibe</span><span>Price</span><span style={{ textAlign: 'right' }}>Status</span>
        </div>
        {rows.map((r, i) => {
          const on = row === i;
          return (
            <div key={r.title + day} onMouseEnter={() => setRow(i)} style={{
              display: 'grid', gridTemplateColumns: '120px 1.6fr 1fr 1fr 120px 150px', alignItems: 'center', padding: '22px 24px',
              borderTop: '1px solid rgba(245,240,235,.12)', borderRadius: on ? 22 : 0, cursor: 'pointer',
              background: on ? 'var(--cream)' : 'transparent', color: on ? 'var(--ink)' : 'var(--noir-ink)',
              transition: `background .35s ${EASE}, color .35s ${EASE}, border-radius .35s`,
              animation: `gr-pop .5s ${i * 0.05}s both ${EASE}`,
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, fontVariantNumeric: 'tabular-nums' }}>{r.t}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em' }}>{r.title}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, opacity: .7 }}>{r.area}</span>
              <span><Chip bg={on ? 'rgba(23,19,16,.08)' : 'rgba(245,240,235,.1)'} color="inherit">{r.vibe}</Chip></span>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16 }}>{r.price}</span>
              <span style={{ textAlign: 'right', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: r.status === 'Few left' ? 'var(--coral)' : 'inherit' }}>
                {r.status} {on ? '→' : ''}
              </span>
            </div>
          );
        })}
        {/* cursor poster */}
        <div style={{
          position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 20,
          transform: `translate(${pos.x + 30}px, ${pos.y - 150}px) rotate(${row === null ? 0 : 6}deg) scale(${row === null ? .6 : 1})`,
          opacity: row === null ? 0 : 1, transition: `opacity .3s, transform .45s ${EASE}`,
        }}>
          {row !== null && rows[row] && <Poster p={POSTERS[rows[row].p]} w={200} h={260} />}
        </div>
      </div>
    </section>
  );
};

// ── 04 · VibePanels — horizontal accordion ──────────────────────────
const VibePanels = ({ city }) => {
  const [open, setOpen] = useState(0);
  return (
    <section style={{ background: 'var(--cream)', padding: '120px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 44 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 84, letterSpacing: '-0.055em', lineHeight: .92 }}>Pick a vibe.</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--ink-2)', maxWidth: 360 }}>Every vibe has its own page in {city.name}, with only that kind of night.</div>
      </div>
      <div style={{ display: 'flex', gap: 12, height: 540 }}>
        {EVENT_TYPES.map((t, i) => {
          const on = open === i;
          return (
            <div key={t.key} onMouseEnter={() => setOpen(i)} style={{
              position: 'relative', flex: on ? 5 : 1, minWidth: 0, borderRadius: 32, overflow: 'hidden', cursor: 'pointer',
              transition: `flex .7s ${EASE}`,
            }}>
              <img src={img(t.img, 900)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${on ? 1 : 1.25})`, transition: `transform 1s ${EASE}` }} />
              <div style={{ position: 'absolute', inset: 0, background: on ? 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,.6))' : 'rgba(23,19,16,.35)', transition: 'background .6s' }} />
              {/* collapsed: vertical label */}
              <div style={{
                position: 'absolute', left: '50%', bottom: 30, transform: 'translateX(-50%) rotate(180deg)', writingMode: 'vertical-rl',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em', color: '#fff', whiteSpace: 'nowrap',
                opacity: on ? 0 : 1, transition: 'opacity .3s',
              }}>{t.label}</div>
              {/* open: details */}
              <div style={{ position: 'absolute', left: 30, right: 30, bottom: 28, color: '#fff', opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : 20}px)`, transition: `all .5s ${EASE} ${on ? '.2s' : '0s'}` }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 58, letterSpacing: '-0.05em', lineHeight: .95 }}>{t.label}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 17, opacity: .9 }}>{t.blurb}</div>
                  <Btn kind="ink" size="sm" dark>{t.label} in {city.name} →</Btn>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ── 05 · AreaReveal — Partiful-style hover list ───────────────────────
const AreaReveal = ({ city }) => {
  const [active, setActive] = useState(null);
  const areas = city.areasMore;
  return (
    <section style={{ background: 'var(--paper)', padding: '120px 0 140px', overflow: 'hidden' }}>
      <div style={{ textAlign: 'center', marginBottom: 50 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 84, letterSpacing: '-0.055em', lineHeight: .92 }}>Closer to home.</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 19, color: 'var(--ink-2)', marginTop: 12 }}>See what's happening in your part of {city.name}.</div>
      </div>
      <div onMouseLeave={() => setActive(null)}>
        {areas.map((a, i) => {
          const on = active === i;
          const dim = active !== null && !on;
          const posters = [0, 1, 2, 3].map(k => cityPosters(city)[(i * 3 + k * 4) % POSTERS.length]);
          return (
            <div key={a} onMouseEnter={() => setActive(i)} style={{ position: 'relative', height: on ? 260 : 150, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: `height .55s ${EASE}`, cursor: 'pointer' }}>
              {/* posters fan out from behind the name, both sides */}
              {posters.map((pp, k) => {
                const side = k % 2 === 0 ? -1 : 1;
                const lane = Math.floor(k / 2); // 0 = near, 1 = far
                const out = side * (330 + lane * 190);
                return (
                  <div key={k} style={{
                    position: 'absolute', left: '50%', top: '50%', zIndex: 1,
                    transform: on
                      ? `translate(calc(-50% + ${out}px), -50%) rotate(${side * (4 + lane * 3)}deg) scale(1)`
                      : `translate(-50%, -50%) rotate(0deg) scale(.4)`,
                    opacity: on ? 1 : 0,
                    transition: `transform .65s ${EASE} ${on ? lane * 0.07 : 0}s, opacity .4s ${on ? lane * 0.07 : 0}s`,
                  }}>
                    <Poster p={pp} w={160} h={210} radius={12} />
                  </div>
                );
              })}
              <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: on ? 800 : 500, fontSize: on ? 128 : 104, letterSpacing: '-0.05em', lineHeight: 1,
                  color: 'var(--ink)', opacity: dim ? 0.18 : 1, transition: `all .5s ${EASE}`,
                }}>{a}</div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: 'var(--ink-2)', marginTop: 4,
                  opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : -6}px)`, transition: `all .4s ${EASE} .1s`,
                }}>Explore {a} ↗</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ── 06 · Host band — ticket stack ────────────────────────────────────
const CityHostX = ({ city }) => (
  <section style={{ background: 'var(--blush)', padding: '120px 80px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 60, alignItems: 'center' }}>
    <div>
      <Eyebrow color="var(--blush-ink)">For hosts in {city.name}</Eyebrow>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 96, letterSpacing: '-0.06em', lineHeight: .9, color: 'var(--blush-ink)', margin: '14px 0 20px' }}>Your place.<br />Your crowd.</div>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 19, color: 'var(--blush-ink)', opacity: .8, lineHeight: 1.6, maxWidth: 480 }}>Approve every guest, set the crowd mix, sell tickets with UPI. Keep 90% of every ticket.</p>
      <div style={{ marginTop: 28 }}><Btn kind="ink">Start hosting free</Btn></div>
    </div>
    <div style={{ position: 'relative', height: 460 }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="gr-hover-lift" style={{ position: 'absolute', left: 60 + i * 70, top: 20 + i * 30, transform: `rotate(${-10 + i * 9}deg)`, boxShadow: 'var(--shadow-pop)', borderRadius: 16 }}>
          <Poster p={cityPosters(city)[[1, 6, 9][i]]} w={240} h={320} />
        </div>
      ))}
    </div>
  </section>
);

// ── 07 · FAQ (static, two-column) ───────────────────────────────────
const CityFaqX = ({ city }) => {
  const [open, setOpen] = useState(0);
  const items = [
    [`Are events in ${city.name} free?`, 'Many are. Free events are request-to-join so the host approves each guest. Paid events book instantly with UPI.'],
    ['Is it safe to go to a stranger’s party?', 'Every guest is phone-verified and 18+. The exact address only goes to confirmed guests, and SOS is one tap away.'],
    [`How do I host in ${city.name}?`, 'Create the event in the app, share the link. First 2 events every month are free; keep 90% of paid tickets.'],
  ];
  return (
    <section style={{ background: 'var(--cream)', padding: '120px 80px', display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 60 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 72, letterSpacing: '-0.055em', lineHeight: .92 }}>Going out in {city.name}?</div>
      <div style={{ borderTop: '1.5px solid var(--ink)' }}>
        {items.map(([q, a], i) => (
          <div key={q} onClick={() => setOpen(open === i ? null : i)} style={{ borderBottom: '1.5px solid var(--ink)', padding: '24px 0', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em' }}>
              {q}<span style={{ width: 36, height: 36, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: open === i ? 'var(--brand-grad)' : 'rgba(23,19,16,.06)', color: open === i ? '#fff' : 'var(--ink)', transform: `rotate(${open === i ? 45 : 0}deg)`, transition: `all .3s ${EASE}` }}>+</span>
            </div>
            <div style={{ maxHeight: open === i ? 120 : 0, overflow: 'hidden', transition: `max-height .45s ${EASE}` }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--ink-2)', lineHeight: 1.6, margin: '12px 0 0', maxWidth: 680 }}>{a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ── 08 · Closing line — grows with scroll ───────────────────────────
const CityOutro = ({ city }) => {
  const ref = useRef(null);
  const p = useScrollProgress(ref);
  return (
    <section ref={ref} style={{ background: 'var(--noir)', padding: '160px 40px', textAlign: 'center', overflow: 'hidden' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 150, letterSpacing: '-0.065em', lineHeight: .9, color: 'var(--noir-ink)', transform: `scale(${0.7 + p * 0.45})`, transition: 'transform .1s linear' }}>
        See you out<br />there, <span className="gr-grad-text">{city.name}.</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}><StoreBadges dark /></div>
    </section>
  );
};

// One record per city — the page template never changes, only this data.
// (In the real site this comes from constants/content.ts + the public API.)
const CITY_PAGES = {
  mumbai: {
    name: 'Mumbai', coords: '19.07° N, 72.87° E', photo: 'neon',
    areas: ['Bandra', 'Khar', 'Andheri', 'Lower Parel', 'Powai', 'Juhu', 'Colaba', 'Worli', 'Versova'],
    areasMore: ['Bandra', 'Khar', 'Andheri', 'Lower Parel', 'Powai', 'Juhu'],
  },
  bangalore: {
    name: 'Bangalore', coords: '12.97° N, 77.59° E', photo: 'gig2',
    areas: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar', 'MG Road'],
    areasMore: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar'],
  },
  delhi: {
    name: 'Delhi', coords: '28.70° N, 77.10° E', photo: 'party3',
    areas: ['Hauz Khas', 'Connaught Place', 'GK', 'Saket', 'Vasant Kunj', 'Rajouri'],
    areasMore: ['Hauz Khas', 'Connaught Place', 'GK', 'Saket', 'Vasant Kunj'],
  },
};

const CityPageX = ({ city = CITY_PAGES.mumbai }) => (
  <div style={{ width: '100%', background: 'var(--cream)', position: 'relative' }}>
    <CityHeroX city={city} />
    <PosterStack city={city} />
    <TonightBoard city={city} />
    <VibePanels city={city} />
    <AreaReveal city={city} />
    <CityHostX city={city} />
    <CityFaqX city={city} />
    <CityOutro city={city} />
    <SiteFooter />
  </div>
);

Object.assign(window, { CityPageX, CITY_PAGES, PosterStack, AreaReveal, TonightBoard, VibePanels, Poster, POSTERS });
