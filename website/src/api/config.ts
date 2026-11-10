function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set. Add it to website/.env.local (or the host's environment).`)
  return value
}

/** Server-side only (no NEXT_PUBLIC_ prefix), so it never reaches the browser. */
export const API_URL = required('API_URL').replace(/\/$/, '')

/**
 * Also server-side only. The API gives requests carrying this key their own
 * rate-limit budget, since every page render comes from the website's one IP.
 */
export const SITE_KEY = process.env.PUBLIC_SITE_KEY ?? ''

/** Seconds Next caches each API response for. */
export const REVALIDATE = 60
