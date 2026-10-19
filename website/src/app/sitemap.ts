import type { MetadataRoute } from 'next'
import { CITIES, EVENT_TYPES } from '@/constants'
import { fetchEvents, fetchHosts, type PublicEvent } from '@/lib/api'
import { allAreaParams, getArea } from '@/lib/area'
import { areaTypePageData } from '@/lib/areaType'
import { CROWDS } from '@/lib/crowd'
import { TIMES } from '@/lib/time'
import { PRICES, pricePageData } from '@/lib/price'
import { OCCASIONS, occasionPageData } from '@/lib/occasion'
import { HOST_GUIDES } from '@/lib/hostGuides'
import { OUT_GUIDES, WOMEN, outGuideHref } from '@/lib/goingOut'
import { HELP_TOPICS } from '@/lib/help'
import { LEGAL_DOCS } from '@/lib/legal'
import { TEAM, founderHref } from '@/lib/founders'
import { absoluteUrl } from '@/lib/seo'

export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]
const page = (path: string, priority = 0.6, changeFrequency: Entry['changeFrequency'] = 'weekly'): Entry => ({
  url: absoluteUrl(path), lastModified: new Date(), changeFrequency, priority,
})

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = []

  // ── Always indexed ──────────────────────────────────────────────────────
  out.push(page('/', 1, 'daily'), page('/cities', 0.8, 'daily'))
  for (const p of ['/about', '/founders', '/app', '/safety', '/host', '/host/payouts', '/host/badges', '/contact', '/help', '/guides', '/host/guides']) out.push(page(p, 0.7, 'monthly'))
  for (const f of TEAM) out.push(page(founderHref(f), 0.5, 'monthly'))
  for (const g of HOST_GUIDES) out.push(page(`/host/guides/${g.slug}`, 0.6, 'monthly'))
  for (const g of [...OUT_GUIDES, ...WOMEN]) out.push(page(outGuideHref(g), 0.6, 'monthly'))
  for (const t of HELP_TOPICS) out.push(page(`/help/${t.slug}`, 0.5, 'monthly'))
  for (const d of LEGAL_DOCS) out.push(page(`/${d.slug}`, 0.3, 'yearly'))
  // India-wide hubs and the city/area/type core
  for (const s of [...CITIES.map(c => c.slug), ...EVENT_TYPES.map(t => t.slug), ...CROWDS.map(c => c.slug), ...TIMES.map(t => t.slug), ...PRICES.map(p => p.slug), ...OCCASIONS.map(o => o.slug)]) out.push(page(`/${s}`, 0.8, 'daily'))
  for (const c of CITIES) for (const t of EVENT_TYPES) out.push(page(`/${c.slug}/${t.slug}`, 0.7, 'daily'))
  for (const a of allAreaParams()) out.push(page(`/${a.city}/${a.facet}`, 0.7, 'daily'))

  // ── Data-driven: only when the page would be indexed ────────────────────
  const live = await fetchEvents({ limit: 1 })
  if (!live) return out

  const total = async (q: Parameters<typeof fetchEvents>[0]) => (await fetchEvents({ ...q, limit: 1 }))?.total ?? 0

  await Promise.all(
    CITIES.map(async c => {
      const [times, crowds, hosts] = await Promise.all([
        Promise.all(TIMES.map(t => total({ when: t.when, city: c.name }))),
        Promise.all(CROWDS.map(cr => total({ ...cr.query, city: c.name }))),
        fetchHosts(c.name, undefined, 60),
      ])
      TIMES.forEach((t, i) => times[i] >= 3 && out.push(page(`/${c.slug}/${t.slug}`, 0.7, 'daily')))
      CROWDS.forEach((cr, i) => crowds[i] >= 3 && out.push(page(`/${c.slug}/${cr.slug}`, 0.7, 'daily')))
      if ((hosts?.total ?? 0) >= 2) out.push(page(`/${c.slug}/hosts`, 0.6, 'daily'))
      // Host profiles: indexed with an upcoming night or 2+ hosted.
      for (const h of hosts?.hosts ?? []) if (h.upcoming_count > 0 || h.hosted_count >= 2) out.push(page(`/h/${h.username}`, 0.5, 'weekly'))
      for (const p of PRICES) if ((await total({ ...p.query, city: c.name })) >= 1) out.push(page(`/${c.slug}/${p.slug}`, 0.7, 'daily'))
      for (const o of OCCASIONS) if (!(await occasionPageData(o, c)).fallback) out.push(page(`/${c.slug}/${o.slug}`, 0.7, 'daily'))
    }),
  )

  // Neighbourhood families
  await Promise.all(
    allAreaParams().map(async ({ city, facet }) => {
      const area = getArea(city, facet)
      if (!area) return
      const hosts = await fetchHosts(area.city.name, area.name, 1)
      if ((hosts?.total ?? 0) >= 2) out.push(page(`/${city}/${facet}/hosts`, 0.5, 'weekly'))
      for (const t of EVENT_TYPES) {
        const d = await areaTypePageData(city, facet, t.slug)
        if (d && d.events.length > 0) out.push(page(`/${city}/${facet}/${t.slug}`, 0.6, 'daily'))
      }
      for (const p of PRICES) {
        const d = await pricePageData(p, undefined, area)
        if (d.events.length && !d.wider) out.push(page(`/${city}/${facet}/${p.slug}`, 0.6, 'daily'))
      }
      for (const o of OCCASIONS) if (!(await occasionPageData(o, undefined, area)).fallback) out.push(page(`/${city}/${facet}/${o.slug}`, 0.6, 'daily'))
    }),
  )

  // Upcoming events (past and cancelled ones are noindex)
  const events = await Promise.all(CITIES.map(c => fetchEvents({ city: c.name, limit: 100 })))
  const seen = new Set<string>()
  for (const e of events.flatMap(r => r?.events ?? []) as PublicEvent[]) {
    if (seen.has(e.id) || e.is_cancelled) continue
    seen.add(e.id)
    out.push(page(`/e/${e.id}`, 0.6, 'daily'))
  }

  return out
}
