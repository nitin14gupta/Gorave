'use client'

import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/**
 * A value that depends on the visitor's clock/locale (dates, "today"). The
 * server, and static HTML built days earlier, renders `fallback`; the real
 * value is computed in the browser, without a hydration mismatch.
 */
export function useClientValue<T>(compute: () => T, fallback: T): T {
  return useSyncExternalStore(noopSubscribe, compute, () => fallback)
}
