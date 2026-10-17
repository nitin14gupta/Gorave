import { cardEvents, fetchHosts } from './api'
import { areaFaq, type Area } from './area'

/** Server-side data for a neighbourhood page: live events in the area (samples if the API is down). */
export async function areaPageData(area: Area) {
  const [{ events }, hostList] = await Promise.all([
    cardEvents(
      { city: area.city.name, area: area.name, limit: 12 },
      e => e.city === area.city.name && e.area.toLowerCase().startsWith(area.name.toLowerCase()),
    ),
    fetchHosts(area.city.name, area.name, 6),
  ])
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Cities', href: '/cities' },
    { label: area.city.name, href: `/${area.city.slug}` },
    { label: area.name, href: `/${area.city.slug}/${area.slug}` },
  ]
  return { area, events, crumbs, faq: areaFaq(area), hosts: hostList?.hosts ?? [], hostTotal: hostList?.total ?? 0 }
}
