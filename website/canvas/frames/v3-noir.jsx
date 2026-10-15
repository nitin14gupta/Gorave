// v3 — Cream + Noir (cinematic)
// Opens in the app's own noir with a full-bleed photo, then alternates
// cream daylight sections with noir "app" sections. The phone mock carries
// the product story in a pinned scroll section.

const V3Hero = () => (
  <section style={{ position: 'relative', height: 940, overflow: 'hidden', background: 'var(--noir)' }}>
    <img src={img('neon', 1800)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .7 }} />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(17,17,17,.2) 0%, rgba(17,17,17,.1) 40%, #111 100%)' }} />
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 50% at 20% 90%, rgba(255,107,53,.35), transparent 70%)' }} />
    <FloatingNav dark />
    <div style={{ position: 'absolute', left: 80, right: 80, bottom: 90, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <Chip bg="rgba(255,255,255,.12)" color="#fff" style={{ backdropFilter: 'blur(10px)', fontSize: 13, padding: '8px 14px' }}><span style={{ width: 8, height: 8, borderRadius: 9, background: 'var(--coral)', animation: 'gr-pulse 2s infinite' }} /> 23 parties happening right now</Chip>
        <h1 style={{ margin: '22px 0 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 150, letterSpacing: '-0.065em', lineHeight: .86, color: '#fff' }}>Find your<br /><span className="gr-grad-text">people.</span></h1>
      </div>
      <div style={{ maxWidth: 380, color: 'var(--noir-ink-2)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 19, lineHeight: 1.6, margin: '0 0 24px' }}>The app for house parties, rooftops and real connections in Gen-Z India. Verified guests. Private addresses. One link.</p>
        <div style={{ display: 'flex', gap: 10 }}><Btn size="lg">Get the app</Btn><Btn kind="ghost" dark size="lg">Browse events</Btn></div>
      </div>
    </div>
  </section>
);

const V3PinnedPhone = () => {
  const steps = [
    ['Discover', 'Everything in your city, closest first. Filter by vibe, date, price or crowd.', true],
    ['Request', 'Free events are host-approved — the crowd stays right, every time.', false],
    ['Pay with UPI', 'GPay, PhonePe or your Gorave Wallet. Refunds land instantly if plans change.', false],
    ['Walk in', 'Exact address unlocks once you\'re in. Your QR ticket opens the door.', false],
  ];
  return (
    <Section bg="var(--cream)" pad="140px 80px">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px 1fr', gap: 60, alignItems: 'center' }}>
        <div>
          <Eyebrow>How it works</Eyebrow>
          <h2 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 76, letterSpacing: '-0.05em', lineHeight: .95 }}>From group chat to guest list.</h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-3)', marginTop: 20 }}>Section pins; the phone screen swaps as each step scrolls past.</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Phone w={330}><AppEventScreen /></Phone>
        </div>
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

const V3EventsRail = () => (
  <section style={{ background: 'var(--noir)', padding: '120px 0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 80px', marginBottom: 40 }}>
      <div>
        <Eyebrow dark>This weekend in Mumbai</Eyebrow>
        <h2 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 76, letterSpacing: '-0.05em', color: 'var(--noir-ink)' }}>Tonight's shortlist</h2>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {['All', 'Free', 'Tonight', 'Rooftops', 'Women only'].map((c, i) => <Chip key={c} bg={i === 0 ? 'var(--noir-ink)' : 'var(--noir-3)'} color={i === 0 ? 'var(--ink)' : 'var(--noir-ink-2)'} style={{ fontSize: 14, padding: '9px 16px' }}>{c}</Chip>)}
      </div>
    </div>
    <div style={{ display: 'flex', gap: 20, paddingLeft: 80, overflow: 'hidden' }}>
      {SAMPLE_EVENTS.map(ev => <EventCard key={ev.title} ev={ev} dark w={320} h={400} />)}
    </div>
  </section>
);

const V3Cities = () => (
  <Section bg="var(--cream)">
    <div style={{ textAlign: 'center' }}>
      <Eyebrow>Live in 8 cities</Eyebrow>
      <h2 style={{ margin: '14px 0 50px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 76, letterSpacing: '-0.05em' }}>Pick a city. Any city.</h2>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
      {CITIES.map((c, i) => (
        <div key={c.name} className="gr-hover-lift" style={{ padding: 22, borderRadius: 26, background: i === 0 ? 'var(--ink)' : 'var(--paper)', color: i === 0 ? 'var(--cream)' : 'var(--ink)', boxShadow: 'var(--shadow-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, letterSpacing: '-0.03em' }}>{c.name}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30 }} className="gr-grad-text">{c.count}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, opacity: .65, marginTop: 6 }}>{c.areas.join(' · ')}</div>
        </div>
      ))}
    </div>
  </Section>
);

const V3Safety = () => (
  <Section bg="var(--cream)" pad="0 80px 120px">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
      <div style={{ gridRow: 'span 2', borderRadius: 34, overflow: 'hidden', position: 'relative', minHeight: 560 }}>
        <img src={img('fr7', 800)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(17,17,17,.9))' }} />
        <div style={{ position: 'absolute', left: 28, right: 28, bottom: 28, color: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, letterSpacing: '-0.04em', lineHeight: .95 }}>Safe by design.</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, opacity: .8, marginTop: 10 }}>18+, phone-verified, reviewed. Every single time.</div>
        </div>
      </div>
      {[['🪪', 'Verified guests', 'Phone OTP + 18+ age gate before anyone can join.'], ['🔒', 'Private addresses', 'The exact address only unlocks for confirmed guests.'], ['⚖️', 'Crowd mix', 'Hosts set 50:50, women-only and more — enforced at the door.'], ['🆘', 'One-tap SOS', 'Shares live location with your emergency contacts.']].map(([e, h, p]) => (
        <div key={h} style={{ padding: 28, borderRadius: 30, background: 'var(--noir)', color: 'var(--noir-ink)' }}>
          <div style={{ fontSize: 30 }}>{e}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, marginTop: 12 }}>{h}</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--noir-ink-2)', marginTop: 6, lineHeight: 1.55 }}>{p}</div>
        </div>
      ))}
    </div>
  </Section>
);

const V3HostCalc = () => (
  <Section bg="var(--noir)" style={{ color: 'var(--noir-ink)' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
      <div>
        <Eyebrow dark>For hosts</Eyebrow>
        <h2 style={{ margin: '14px 0 20px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 84, letterSpacing: '-0.05em', lineHeight: .92 }}>Your living room<br />is a <span className="gr-grad-text">venue.</span></h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--noir-ink-2)', lineHeight: 1.6, maxWidth: 460 }}>Get discovered in Trending and nearby feeds. 90% of every ticket lands in your UPI after the event.</p>
        <div style={{ marginTop: 30 }}><Btn size="lg">Start hosting free</Btn></div>
      </div>
      <div style={{ padding: 36, borderRadius: 36, background: 'var(--noir-2)', boxShadow: '0 0 0 1px rgba(255,255,255,.06)' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--noir-ink-2)' }}>Earnings calculator</div>
        {[['Guests', 40, 0.4], ['Ticket price', '₹499', 0.25]].map(([l, v, p]) => (
          <div key={l} style={{ marginTop: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 16 }}><span>{l}</span><b>{v}</b></div>
            <div style={{ height: 8, borderRadius: 9, background: 'var(--noir-3)', marginTop: 12, position: 'relative' }}>
              <div style={{ width: `${p * 100}%`, height: '100%', borderRadius: 9, background: 'var(--brand-grad)' }} />
              <div style={{ position: 'absolute', left: `calc(${p * 100}% - 11px)`, top: -7, width: 22, height: 22, borderRadius: 99, background: '#fff' }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 34, paddingTop: 26, borderTop: '1px solid var(--noir-3)' }}>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--noir-ink-2)' }}>You'd take home</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 72, letterSpacing: '-0.04em' }} className="gr-grad-text">₹17,964</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--noir-ink-2)' }}>per event, after Gorave's 10%</div>
        </div>
      </div>
    </div>
  </Section>
);

const V3Cta = () => (
  <section style={{ background: 'var(--noir)', padding: '40px 80px 120px' }}>
    <div style={{ borderRadius: 44, padding: '90px 80px', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative' }}>
      <div>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 96, letterSpacing: '-0.06em', lineHeight: .9 }}>Your Saturday<br />is waiting.</h2>
        <div style={{ marginTop: 30 }}><StoreBadges /></div>
      </div>
      <div style={{ display: 'flex', gap: -40, marginBottom: -200 }}>
        <Phone w={240} tilt={-8}><AppEventScreen ev={SAMPLE_EVENTS[4]} /></Phone>
        <div style={{ marginLeft: -60, marginTop: 60 }}><Phone w={240} tilt={6}><AppEventScreen ev={SAMPLE_EVENTS[0]} /></Phone></div>
      </div>
    </div>
  </section>
);

const LandingV3 = () => (
  <div style={{ width: '100%', background: 'var(--noir)', position: 'relative' }}>
    <V3Hero />
    <div style={{ background: 'var(--noir)', padding: '26px 0', borderTop: '1px solid var(--noir-3)' }}>
      <WordMarquee dark size={56} words={['Verified 18+', 'House parties', 'Rooftops', 'UPI payouts', 'Game nights', 'Private addresses']} />
    </div>
    <V3PinnedPhone />
    <V3EventsRail />
    <V3Cities />
    <V3Safety />
    <V3HostCalc />
    <V3Cta />
    <SiteFooter />
  </div>
);

Object.assign(window, { LandingV3, V3Hero });
