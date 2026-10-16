import Link from 'next/link'
import { breadcrumbLd, type Crumb } from '@/lib/seo'
import { cn } from '@/lib/cn'
import { JsonLd } from './JsonLd'

/** Visible trail + matching BreadcrumbList structured data. Last crumb is the current page. */
export function Breadcrumbs({ crumbs, className }: { crumbs: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('font-sans text-sm font-bold text-ink-3', className)}>
      <JsonLd data={breadcrumbLd(crumbs)} />
      <ol className="flex flex-wrap items-center gap-2">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={c.href} className="flex items-center gap-2">
              {last ? (
                <span aria-current="page" className="text-ink">{c.label}</span>
              ) : (
                <Link href={c.href} className="transition-colors hover:text-ink">{c.label}</Link>
              )}
              {!last && <span aria-hidden>/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
