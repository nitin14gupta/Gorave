import type { Metadata } from 'next'
import { NotFoundView } from '@/components/sections/notfound/NotFoundView'

export const metadata: Metadata = { title: 'Page not found', robots: { index: false, follow: true } }

// Shown for unknown URLs and every notFound() call (unknown city, type, guide…).
export default function NotFound() {
  return <NotFoundView />
}
