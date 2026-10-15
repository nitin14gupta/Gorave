// system.jsx — navigation states, type + colour system and the page map.

const NavStates = ({ state = 'default' }) => (
  <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--cream)', overflow: 'hidden' }}>
    <img src={img('party4', 1600)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: state === 'scrolled' ? .35 : .18 }} />
    {state !== 'scrolled' && <FloatingNav active={state === 'events' ? 'Events' : state === 'cities' ? 'Cities' : null} />}
    {state === 'events' && <MegaMenu menu="Events" />}
    {state === 'cities' && <MegaMenu menu="Cities" />}
    {state === 'scrolled' && (
      <>
        <div style={{ position: 'absolute', top: 18, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 13, color: 'var(--ink-3)' }}>↑ nav slid away on scroll-down · returns on scroll-up or cursor near top</div>
        <FloatingDock />
      </>
    )}
    <div style={{ position: 'absolute', left: 40, bottom: state === 'scrolled' ? 100 : 30, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--ink-2)', maxWidth: 520, lineHeight: 1.6 }}>
      {state === 'default' && 'Floating glass pill, centred. Logo · Events ▾ · Cities ▾ · Host · Guides · Safety · Host an event · Get the app.'}
      {state === 'events' && 'Hover "Events" → panel morphs open (height animates, content cross-fades). Every link here is an SEO page: /house-parties, /mumbai/this-weekend, /free-events …'}
      {state === 'cities' && 'Same panel, morphs to Cities. Moving between menus never closes the panel — it resizes, like apple.com.'}
    </div>
  </div>
);

const TypeAndColour = () => {
  const sw = [['Cream', '--cream'], ['Paper', '--paper'], ['Ink', '--ink'], ['Orange', '--orange'], ['Coral', '--coral'], ['Noir', '--noir'], ['Blush', '--blush'], ['Sage', '--sage'], ['Sky', '--sky'], ['Gold', '--gold']];
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--paper)', padding: 56, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 50 }}>
      <div>
        <Eyebrow>Type</Eyebrow>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 92, letterSpacing: '-0.055em', lineHeight: .95, marginTop: 16 }}>Cabinet Grotesk</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-3)' }}>Display · 800 · −5.5% tracking — v1/v2/v3 headings (same as the app)</div>
        <div style={{ fontFamily: 'var(--font-shout)', fontSize: 104, textTransform: 'uppercase', lineHeight: .9, marginTop: 30 }}>Anton shout</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--ink-3)' }}>Condensed display — v4 headings (the Partiful pairing you liked)</div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 22, lineHeight: 1.55, marginTop: 30, maxWidth: 560 }}>Satoshi body. House parties, rooftops, game nights and supper clubs — hosted by real people near you.</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 34, marginTop: 20, color: 'var(--orange)' }}>Instrument Serif — editorial accents</div>
      </div>
      <div>
        <Eyebrow>Colour</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 16 }}>
          {sw.map(([n, v]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, background: '#fff' }}>
              <span style={{ width: 46, height: 46, borderRadius: 12, background: `var(${v})`, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08)' }} />
              <div><div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14 }}>{n}</div><div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--ink-3)' }}>{v}</div></div>
            </div>
          ))}
        </div>
        <div style={{ height: 70, borderRadius: 18, background: 'var(--brand-grad)', marginTop: 16, display: 'flex', alignItems: 'center', paddingLeft: 20, color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 700 }}>Brand gradient · CTAs only (same rule as the app)</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}><Btn>Primary</Btn><Btn kind="ink">Ink</Btn><Btn kind="ghost">Ghost</Btn></div>
      </div>
    </div>
  );
};

const PageMap = () => {
  const groups = [
    ['Core', [['Home', '/'], ['Download', '/app'], ['About', '/about'], ['Safety', '/safety']]],
    ['City', [['City', '/mumbai'], ['Neighbourhood', '/mumbai/bandra'], ['City × type', '/mumbai/house-parties'], ['City × time', '/mumbai/this-weekend · /tonight · /new-years-eve'], ['City × price', '/mumbai/free-events · /under-500'], ['City × crowd', '/mumbai/women-only · /21-plus']]],
    ['Event types', [['Type hub', '/house-parties · /rooftop-parties · /game-nights · /supper-clubs · /gigs']]],
    ['Dynamic', [['Event', '/e/[id] — link previews + open in app'], ['Host profile', '/h/[username]']]],
    ['Hosts', [['Host landing', '/host'], ['Guides', '/host/how-to-throw-a-house-party …'], ['Payouts', '/host/payouts'], ['Badges', '/host/badges']]],
    ['Help & legal', [['Help centre', '/help · /help/[topic]'], ['FAQ per type', '/house-parties/faq'], ['Legal', '/terms · /privacy · /guidelines · /refunds']]],
    ['Later', [['Blog', '/blog · /blog/[slug]']]],
  ];
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--noir)', color: 'var(--noir-ink)', padding: 56 }}>
      <Eyebrow dark>Website page map — ~12 templates, hundreds of pages from data</Eyebrow>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginTop: 28 }}>
        {groups.map(([g, pages]) => (
          <div key={g} style={{ padding: 22, borderRadius: 24, background: 'var(--noir-2)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24 }}>{g}</div>
            {pages.map(([n, u]) => (
              <div key={n} style={{ marginTop: 12 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14 }}>{n}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--noir-ink-2)' }}>{u}</div>
              </div>
            ))}
          </div>
        ))}
        <div style={{ padding: 22, borderRadius: 24, background: 'var(--brand-grad)', color: '#fff' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24 }}>Rule</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, marginTop: 10, lineHeight: 1.6 }}>A combination page only goes live (indexed) when it has real events or written content — no thin pages.</div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { NavStates, TypeAndColour, PageMap });
