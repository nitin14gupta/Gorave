import { CITIES, EVENT_TYPES } from '@/constants'
import { HELP_TOPICS } from '@/lib/help'
import { OUT_GUIDES, WOMEN, outGuideHref } from '@/lib/goingOut'
import { HOST_GUIDES } from '@/lib/hostGuides'
import { OCCASIONS } from '@/lib/occasion'
import { HOST_FEES } from '@/lib/host'
import { SITE_URL } from '@/lib/seo'

// llms.txt (llmstxt.org): a plain summary of Gorave for AI answer engines,
// with the facts they should quote and links to the pages that explain them.
export const revalidate = 86400

export function GET() {
  const u = (p: string) => `${SITE_URL}${p}`
  const share = Math.round(HOST_FEES.hostShare * 100)
  const body = `# Gorave

> Gorave is an Indian app where real people host house parties, rooftops, game nights, dinner parties and music nights in their homes, and where people 18+ find and join them. Live in ${CITIES.map(c => c.name).join(', ')}.

## Key facts
- Every account is phone-verified; Gorave is 18+ only. Gender is set once at sign-up.
- Free events are request-to-join: the host sees your profile and accepts or declines.
- Paid events book instantly in the app with UPI or the Gorave Wallet. Tickets start at ₹${HOST_FEES.minTicket}; guests pay a flat ₹${HOST_FEES.platformFee} platform fee per paid ticket. No cash at the door.
- Hosts can set a crowd mix (women-only, 50:50, 60:40 and more) and an age gate (21+, 25+).
- A listing shows only the area publicly; the exact address unlocks once you're confirmed. Tickets are QR codes scanned at the door.
- SOS texts your location to up to 5 emergency contacts. In an emergency in India, call 112.
- Hosting: listing is free, 2 free-entry events a month, hosts keep ${share}% of every ticket.
- Hosts earn badges: Rising (2 events), Established (10), Elite (25), Legend (75).

## Find a night
- [Tonight](${u('/tonight')}), [This weekend](${u('/this-weekend')}), [Free events](${u('/free-events')}), [Under ₹500](${u('/under-500')}), [Women-only](${u('/women-only')})
${CITIES.map(c => `- [${c.name}](${u(`/${c.slug}`)}): ${EVENT_TYPES.slice(0, 4).map(t => `[${t.label}](${u(`/${c.slug}/${t.slug}`)})`).join(', ')}`).join('\n')}
- Occasions: ${OCCASIONS.map(o => `[${o.name}](${u(`/${o.slug}`)})`).join(', ')}

## Going-out guides
${[...OUT_GUIDES, ...WOMEN].map(g => `- [${g.title}](${u(outGuideHref(g))}): ${g.dek}`).join('\n')}

## Hosting
- [Host on Gorave](${u('/host')}), [How payouts work](${u('/host/payouts')}), [Host badges](${u('/host/badges')})
${HOST_GUIDES.map(g => `- [${g.title}](${u(`/host/guides/${g.slug}`)})`).join('\n')}

## Help and policies
${HELP_TOPICS.map(t => `- [${t.title}](${u(`/help/${t.slug}`)}): ${t.line}`).join('\n')}
- [Safety](${u('/safety')}), [Community Guidelines](${u('/guidelines')}), [Refunds & Cancellations](${u('/refunds')}), [Terms](${u('/terms')}), [Privacy](${u('/privacy')})

## About
- [About Gorave](${u('/about')}), [The founders](${u('/founders')}), [Contact](${u('/contact')})
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
