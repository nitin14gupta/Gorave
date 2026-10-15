// final.jsx — the picked landing page. V1's art direction + the sections the
// team chose from V3/V4. Two finals differ only in the section-heading font:
//   A · "Editorial"  — Cabinet Grotesk everywhere (one font family, calm)
//   B · "Editorial + Shout" — Anton condensed caps for section headings
// No invented numbers, ratings or testimonials: copy only claims what the
// product actually does today (see client/server features).

const H2 = ({ children, shout, size = 84, color = 'var(--ink)', style }) => shout ? (
  <h2 style={{ margin: 0, fontFamily: 'var(--font-shout)', fontWeight: 400, fontSize: size * 1.25, lineHeight: .9, textTransform: 'uppercase', letterSpacing: '-0.005em', color, ...style }}>{children}</h2>
) : (
  <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size, lineHeight: .95, letterSpacing: '-0.05em', color, ...style }}>{children}</h2>
);

const Lede = ({ children, color = 'var(--ink-2)', style }) => (
  <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.6, color, margin: 0, ...style }}>{children}</p>
);

// 01 · Hero (V1)
const FHero = () => (
  <section style={{ position: 'relative', background: 'var(--cream)', padding: '150px 80px 100px', overflow: 'hidden' }}>
    <FloatingNav />
    <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 40, alignItems: 'center' }}>
      <div>
        <Eyebrow>Live in Mumbai, Bangalore, Delhi + 5 more</Eyebrow>
        <div style={{ height: 22 }} />
        <V1Headline />
        <Lede style={{ fontSize: 20, maxWidth: 560, margin: '30px 0 34px' }}>
          House parties, rooftops, game nights and supper clubs, hosted by real people near you. One link for the invite, the guest list and the door.
        </Lede>
        <div style={{ display: 'flex', gap: 12 }}>
          <Btn size="lg">Find a party</Btn>
          <Btn kind="ghost" size="lg">Host one free</Btn>
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 30, fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 700, color: 'var(--ink-3)' }}>
          <span>18+ only</span><span>·</span><span>Phone-verified guests</span><span>·</span><span>UPI payments</span>
        </div>
      </div>
      <div style={{ position: 'relative', height: 720 }}>
        <V1Polaroid k="roof1" label="bandra, sat" rot={-8} style={{ top: 10, left: -20 }} />
        <V1Polaroid k="game1" label="mafia night" rot={7} style={{ bottom: 20, right: -30, animationDelay: '1.5s' }} />
        <div style={{ position: 'absolute', top: 70, left: 70, width: 380, padding: 22, borderRadius: 36, background: 'rgba(251,247,239,.85)', backdropFilter: 'blur(14px)', boxShadow: 'var(--shadow-pop)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid var(--line)', marginBottom: 14 }}>
            <AvatarStack n={3} size={26} ring="var(--paper)" />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>the sat plan</div>
          </div>
          <ChatThread />
        </div>
      </div>
    </div>
  </section>
);

// 02 · This week (replaces the word marquee — real events, not decoration)
const FThisWeek = ({ shout }) => (
  <section style={{ background: 'var(--paper)', padding: '110px 0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 80px', marginBottom: 40 }}>
      <div>
        <Eyebrow>Happening this week</Eyebrow>
        <H2 shout={shout} size={72} style={{ marginTop: 14 }}>This week in Mumbai</H2>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {['Mumbai', 'Bangalore', 'Delhi', 'Pune'].map((c, i) => (
          <Chip key={c} bg={i === 0 ? 'var(--ink)' : '#fff'} color={i === 0 ? 'var(--cream)' : 'var(--ink-2)'} style={{ fontSize: 14, padding: '10px 16px', boxShadow: i ? 'inset 0 0 0 1.5px var(--line)' : 'none' }}>{c}</Chip>
        ))}
        <span className="gr-underline" style={{ marginLeft: 14, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15 }}>All events →</span>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 20, paddingLeft: 80, overflow: 'hidden' }}>
      {SAMPLE_EVENTS.map(ev => <EventCard key={ev.title} ev={ev} w={300} h={400} />)}
    </div>
    <div style={{ padding: '18px 80px 0', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--ink-3)' }}>Drag or scroll sideways · filled live from the API by city</div>
  </section>
);

// 03 · One link. Everyone's in. (V1)
const FOneLink = ({ shout }) => {
  const steps = [
    ['01', 'Find your night', 'Browse by vibe, date or price. Closest to you first.', <InviteCard ev={SAMPLE_EVENTS[1]} width={240} tilt={-3} />],
    ['02', 'Request or book', 'Free events are host-approved so the crowd stays right. Paid ones book in a tap with UPI.',
      <div style={{ width: 260, padding: 16, borderRadius: 22, background: 'var(--noir)', color: 'var(--noir-ink)', boxShadow: 'var(--shadow-pop)', transform: 'rotate(2deg)' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--noir-ink-2)' }}>gorave · now</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginTop: 4 }}>You're in!</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--noir-ink-2)', marginTop: 4 }}>Your request for Bollywood Retro Night was accepted. Ticket ready.</div>
      </div>],
    ['03', 'Show up, scan in', 'The exact address unlocks once you\'re in. Your QR ticket gets you through the door.',
      <div style={{ width: 210, padding: 18, borderRadius: 26, background: '#fff', boxShadow: 'var(--shadow-pop)', transform: 'rotate(-2deg)', textAlign: 'center' }}>
        <div style={{ width: 150, height: 150, margin: '0 auto', borderRadius: 12, background: 'repeating-conic-gradient(var(--ink) 0 25%, #fff 0 50%) 0 0/18px 18px' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginTop: 12 }}>Ticket · Riya S.</div>
      </div>],
  ];
  return (
    <Section bg="var(--cream)">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 70 }}>
        <H2 shout={shout}>One link.<br />Everyone's in.</H2>
        <Lede style={{ maxWidth: 380 }}>No more "who's coming?" in the group chat. Gorave handles the guest list, the money and the door.</Lede>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1.5px solid var(--ink)' }}>
        {steps.map(([n, h, p, art], i) => (
          <div key={n} style={{ padding: '34px 30px 0', borderLeft: i ? '1.5px solid var(--ink)' : 'none' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 40, color: 'var(--orange)' }}>{n}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '-0.03em', marginTop: 8 }}>{h}</div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--ink-2)', lineHeight: 1.6, minHeight: 80 }}>{p}</p>
            <div style={{ height: 330, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{art}</div>
          </div>
        ))}
      </div>
    </Section>
  );
};

// 04 · From group chat to guest list (V3 pinned phone)
const FGroupChat = ({ shout }) => {
  const steps = [
    ['Discover', 'Everything in your city, closest first. Filter by vibe, date, price or crowd.', true],
    ['Request', 'Free events are host-approved. The crowd stays right, every time.', false],
    ['Pay with UPI', 'GPay, PhonePe or your Gorave Wallet. If the host cancels, refunds land in your wallet.', false],
    ['Walk in', 'The exact address unlocks once you\'re in. Your QR ticket opens the door.', false],
  ];
  return (
    <Section bg="var(--paper)" pad="140px 80px">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px 1fr', gap: 60, alignItems: 'center' }}>
        <div>
          <Eyebrow>How it works</Eyebrow>
          <H2 shout={shout} size={72} style={{ marginTop: 14 }}>From group chat to guest list.</H2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}><Phone w={330}><AppEventScreen /></Phone></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          {steps.map(([h, p, on], i) => (
            <div key={h} style={{ paddingLeft: 22, borderLeft: `3px solid ${on ? 'var(--orange)' : 'var(--line)'}`, opacity: on ? 1 : .45 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--ink-3)' }}>0{i + 1}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em' }}>{h}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 4 }}>{p}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

// 05 · Pick your kind of night (V1, horizontal pinned scroll)
const FTypes = ({ shout }) => (
  <section style={{ background: 'var(--cream)', padding: '120px 0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 80px', marginBottom: 46 }}>
      <div>
        <Eyebrow>A million reasons to hang</Eyebrow>
        <H2 shout={shout} style={{ marginTop: 14 }}>Pick your kind<br />of night.</H2>
      </div>
      <span className="gr-underline" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15 }}>Browse every type →</span>
    </div>
    <div style={{ display: 'flex', gap: 22, padding: '0 80px', overflow: 'hidden' }}>
      {EVENT_TYPES.map((t, i) => (
        <div key={t.key} className="gr-hover-lift gr-zoom" style={{ width: 340, height: 480, flexShrink: 0, borderRadius: 32, overflow: 'hidden', position: 'relative', transform: `translateY(${i % 2 ? 40 : 0}px)` }}>
          <img src={img(t.img, 700)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, padding: 18, borderRadius: 22, background: t.tint, color: t.ink }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em' }}>{t.label}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, marginTop: 4, opacity: .8 }}>{t.blurb}</div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

// 06 · Where's the party tonight? (V1 cities, cursor preview)
const FCities = ({ shout }) => (
  <Section bg="var(--paper)">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 60 }}>
      <div>
        <Eyebrow>Cities</Eyebrow>
        <H2 shout={shout} size={72} style={{ margin: '14px 0 20px' }}>Where's the party tonight?</H2>
        <Lede>Pick your city to see what's on near you. Hover one to peek inside.</Lede>
      </div>
      <div style={{ position: 'relative' }}>
        {CITIES.slice(0, 6).map((c, i) => (
          <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderTop: '1.5px solid var(--ink)', color: i === 0 ? 'var(--orange)' : 'var(--ink)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, letterSpacing: '-0.04em' }}>{c.name}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: i === 0 ? 'var(--orange)' : 'var(--ink-3)' }}>{c.areas.slice(0, 3).join(' · ')} →</span>
          </div>
        ))}
        <div style={{ position: 'absolute', top: -40, left: 290, width: 230, height: 290, borderRadius: 22, overflow: 'hidden', transform: 'rotate(5deg)', boxShadow: 'var(--shadow-pop)', pointerEvents: 'none' }}>
          <img src={img('roof2', 500)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
    </div>
  </Section>
);

// 07 · More than an invite (V4 layout)
const FMoreThan = ({ shout }) => (
  <Section bg="var(--cream)">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <H2 shout={shout} size={90}>More than<br />an invite</H2>
        <Lede style={{ fontSize: 22, marginTop: 14 }}>Everything you need to build a community.</Lede>
      </div>
      <div style={{ display: 'flex', gap: 10 }}><Btn kind="ghost">For hosts</Btn><Btn kind="ink">Get the app</Btn></div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginTop: 56 }}>
      {[['Sell tickets.', 'tickets', true], ['Set the crowd mix.', 'mix', true], ['Approve every guest.', 'requests', false], ['Reminders, automatically.', 'remind', false]].map(([cap, kind, more]) => (
        <div key={cap}>
          <div className="gr-hover-lift" style={{ height: 380, borderRadius: 24, background: '#E9E1CF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {kind === 'tickets' && <img src="assets/img/hostXgorave.png" style={{ width: 240 }} />}
            {kind === 'mix' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: shout ? 'var(--font-shout)' : 'var(--font-display)', fontWeight: shout ? 400 : 800, fontSize: 120, letterSpacing: '-0.04em', lineHeight: 1 }}>50<span className="gr-grad-text">:</span>50</div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: 'var(--ink-2)', marginTop: 8 }}>4 women · 5 men · 1 open</div>
              </div>
            )}
            {kind === 'requests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 260 }}>
                {[['Riya', '3 mutual'], ['Arjun', 'Came to your events'], ['Dia', '5 events attended']].map(([n, s], j) => (
                  <div key={n} style={{ padding: '12px 14px', borderRadius: 16, background: '#fff', boxShadow: 'var(--shadow-soft)', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <img src={AVATARS[j + 2]} style={{ width: 32, height: 32, borderRadius: 99, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}><div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14 }}>{n}</div><div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--green)' }}>{s}</div></div>
                    <span style={{ width: 28, height: 28, borderRadius: 99, background: 'var(--ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✓</span>
                  </div>
                ))}
              </div>
            )}
            {kind === 'remind' && (
              <Phone w={180}><div style={{ padding: '58px 10px' }}>
                <div style={{ padding: 11, borderRadius: 14, background: 'rgba(255,255,255,.12)', color: '#fff', fontFamily: 'var(--font-body)', fontSize: 11.5, lineHeight: 1.4 }}><b>Sunset Rooftop Sessions</b> starts in 2 hours. Exact address unlocked.</div>
              </div></Phone>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 21, color: 'var(--ink-2)', marginTop: 16 }}>{cap} {more && <span style={{ color: 'var(--ink)', textDecoration: 'underline' }}>Learn more</span>}</div>
        </div>
      ))}
    </div>
  </Section>
);

// 08 · Safety (V1 noir — the portal into the app)
const FSafety = ({ shout }) => {
  const cards = [
    ['Every guest is verified', 'Phone-verified and 18+ only. Hosts see who\'s asking before they accept.'],
    ['Addresses stay private', 'Only confirmed guests get the exact location. Everyone else sees the area.'],
    ['SOS in one tap', 'Shares your live location with your emergency contacts, even in the background.'],
    ['Reviewed hosts', 'Guests rate every event. Hosts earn badges from Rising to Legend.'],
  ];
  return (
    <Section bg="var(--noir)" style={{ color: 'var(--noir-ink)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 70, alignItems: 'start' }}>
        <div>
          <Eyebrow dark>Safety, built in</Eyebrow>
          <H2 shout={shout} size={80} color="var(--noir-ink)" style={{ margin: '14px 0 20px' }}>Go out.<br /><span className="gr-grad-text">Feel safe.</span></H2>
          <Lede color="var(--noir-ink-2)" style={{ maxWidth: 440 }}>Strangers become friends faster when everyone's real. That's the point of Gorave.</Lede>
          <div style={{ marginTop: 30 }}><Btn kind="ghost" dark>How we keep events safe</Btn></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cards.map(([h, p], i) => (
            <div key={h} style={{ display: 'flex', gap: 20, padding: 28, borderRadius: 28, background: 'var(--noir-2)', boxShadow: '0 0 0 1px rgba(255,255,255,.06)', transform: `translateX(${i * 18}px)` }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 34, color: 'var(--orange)', lineHeight: 1 }}>0{i + 1}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24 }}>{h}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--noir-ink-2)', marginTop: 6, lineHeight: 1.55 }}>{p}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

// 09 · Hosts (V1, honest numbers only)
const FHosts = ({ shout }) => (
  <Section bg="var(--blush)">
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 60, alignItems: 'center' }}>
      <div>
        <Eyebrow color="var(--blush-ink)">For hosts</Eyebrow>
        <H2 shout={shout} color="var(--blush-ink)" style={{ margin: '14px 0 20px' }}>Throw it.<br />Fill it.<br />Get paid.</H2>
        <Lede color="var(--blush-ink)" style={{ opacity: .8, maxWidth: 480 }}>Sell tickets with UPI, set the crowd mix and approve every guest. Your payout lands in your UPI or bank account after the event.</Lede>
        <div style={{ display: 'flex', gap: 46, margin: '34px 0' }}>
          {[['90%', 'of every ticket is yours'], ['2', 'free events every month'], ['₹0', 'to start hosting']].map(([n, l]) => (
            <div key={l}><div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48, color: 'var(--blush-ink)' }}>{n}</div><div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--blush-ink)', opacity: .7 }}>{l}</div></div>
          ))}
        </div>
        <Btn kind="ink">Become a host</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {[['rising', 'Rising', '2+ events'], ['established', 'Established', '10+'], ['elite', 'Elite', '25+'], ['legend', 'Legend', '75+']].map(([b, n, r], i) => (
          <div key={b} className="gr-hover-lift" style={{ padding: 24, borderRadius: 28, background: 'rgba(255,255,255,.55)', textAlign: 'center', transform: `rotate(${[-3, 2, 2, -2][i]}deg)` }}>
            <img src={`assets/img/${b}.png`} style={{ width: 110, height: 110, objectFit: 'contain' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--blush-ink)' }}>{n}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--blush-ink)', opacity: .7 }}>{r} hosted</div>
          </div>
        ))}
      </div>
    </div>
  </Section>
);

// 10 · Your Saturday is waiting (V3 CTA)
const FSaturday = ({ shout }) => (
  <section style={{ background: 'var(--noir)', padding: '120px 80px' }}>
    <div style={{ borderRadius: 44, padding: '90px 80px', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative', height: 560 }}>
      <div>
        <H2 shout={shout} size={96}>Your Saturday<br />is waiting.</H2>
        <Lede style={{ margin: '20px 0 30px' }}>Get the app and find something to do this weekend.</Lede>
        <StoreBadges />
      </div>
      <div style={{ display: 'flex', alignSelf: 'flex-start', marginTop: 10 }}>
        <Phone w={240} tilt={-8}><AppEventScreen ev={SAMPLE_EVENTS[4]} /></Phone>
        <div style={{ marginLeft: -60, marginTop: 70 }}><Phone w={240} tilt={6}><AppEventScreen ev={SAMPLE_EVENTS[0]} /></Phone></div>
      </div>
    </div>
  </section>
);

const LandingFinal = ({ shout = false }) => (
  <div style={{ width: '100%', background: 'var(--cream)', position: 'relative' }}>
    <FHero />
    <FThisWeek shout={shout} />
    <FOneLink shout={shout} />
    <FGroupChat shout={shout} />
    <FTypes shout={shout} />
    <FCities shout={shout} />
    <FMoreThan shout={shout} />
    <FSafety shout={shout} />
    <FHosts shout={shout} />
    <FSaturday shout={shout} />
    <SiteFooter />
  </div>
);

Object.assign(window, { LandingFinal });
