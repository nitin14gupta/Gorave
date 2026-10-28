import AsyncStorage from '@react-native-async-storage/async-storage'
import { decryptText, encryptText, forgetCacheKey, isEncrypted } from './cacheCrypto'

const PREFIX = 'vy_cache:'

// Private things are encrypted on disk (see cacheCrypto): your messages and
// chat list, and your own profile (phone, birthday). Everything else, like
// other people's public profiles or event lists, is stored as plain JSON.
const isPrivate = (key: string) => key.startsWith('chat:') || key === 'profile:me'

async function decode<T>(key: string, raw: string): Promise<Entry<T> | null> {
  if (isEncrypted(raw)) {
    const plain = await decryptText(raw)
    return plain ? (JSON.parse(plain) as Entry<T>) : null
  }
  // A private key saved before encryption existed: read it once; the next
  // write replaces it with the encrypted form.
  return JSON.parse(raw) as Entry<T>
}

interface Entry<T> {
  value: T
  expiresAt: number | null
}

const memory = new Map<string, Entry<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()

function isFresh(entry: Entry<unknown> | undefined | null): entry is Entry<unknown> {
  if (!entry) return false
  return entry.expiresAt === null || entry.expiresAt > Date.now()
}

async function readDisk<T>(key: string): Promise<Entry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key)
    return raw ? await decode<T>(key, raw) : null
  } catch {
    return null
  }
}

function writeDisk<T>(key: string, entry: Entry<T>) {
  const json = JSON.stringify(entry)
  // If encryption can't run (keystore unavailable), nothing is saved: never
  // fall back to writing private data in the clear.
  ;(isPrivate(key) ? encryptText(json) : Promise.resolve(json))
    .then(out => AsyncStorage.setItem(PREFIX + key, out))
    .catch(() => {})
}

export function peekCached<T>(key: string): T | null {
  const entry = memory.get(key) as Entry<T> | undefined
  return entry ? entry.value : null
}

/**
 * Copy what's saved on the phone into memory, so screens that read with
 * peekCached (your profile, the chat list, Home) paint on their very first
 * frame after a cold start instead of showing a loader while they refetch.
 * Run once at startup; stale values are fine, the screens revalidate.
 */
export async function warmFromDisk(keys: readonly string[]): Promise<void> {
  try {
    const rows = await AsyncStorage.multiGet(keys.map(k => PREFIX + k))
    await Promise.all(rows.map(async ([fullKey, raw]) => {
      if (!raw) return
      const key = fullKey.slice(PREFIX.length)
      if (memory.has(key)) return
      try {
        const entry = await decode(key, raw)
        if (entry && !memory.has(key)) memory.set(key, entry)
      } catch {}
    }))
  } catch {}
}

/** What's cached for this key, fresh or not, and whether it's still fresh. */
export async function peekEntry<T>(key: string): Promise<{ value: T; fresh: boolean } | null> {
  const mem = memory.get(key) as Entry<T> | undefined
  if (mem) return { value: mem.value, fresh: isFresh(mem) }
  const disk = await readDisk<T>(key)
  if (!disk) return null
  memory.set(key, disk)
  return { value: disk.value, fresh: isFresh(disk) }
}

export async function invalidate(key: string): Promise<void> {
  memory.delete(key)
  try { await AsyncStorage.removeItem(PREFIX + key) } catch {}
}

export function setCached<T>(key: string, value: T, ttlMs: number | null = 5 * 60_000, persist = true): void {
  const entry: Entry<T> = { value, expiresAt: ttlMs === null ? null : Date.now() + ttlMs }
  memory.set(key, entry)
  if (persist) writeDisk(key, entry)
}

export async function clearAllCached(): Promise<void> {
  memory.clear()
  inFlight.clear()
  // Logout: drop the encryption key first, so even a failed delete below
  // leaves nothing readable behind.
  await forgetCacheKey()
  try {
    const keys = await AsyncStorage.getAllKeys()
    const ours = keys.filter(k => k.startsWith(PREFIX))
    if (ours.length) await AsyncStorage.multiRemove(ours)
  } catch {}
}

interface Options<T> {
  ttlMs?: number | null | ((value: T) => number | null)
  /** false = memory-only, gone when the app restarts (short-lived dedup, not worth a disk write) */
  persist?: boolean
}

export async function getOrFetch<T>(key: string, fetcher: () => Promise<T>, opts: Options<T> = {}): Promise<T> {
  const { ttlMs = 60_000, persist = true } = opts

  const mem = memory.get(key) as Entry<T> | undefined
  if (isFresh(mem)) return mem.value

  if (persist) {
    const disk = await readDisk<T>(key)
    if (isFresh(disk)) {
      memory.set(key, disk)
      return disk.value
    }
  }

  const existing = inFlight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const promise = fetcher()
    .then(value => {
      const resolvedTtl = typeof ttlMs === 'function' ? ttlMs(value) : ttlMs
      const entry: Entry<T> = { value, expiresAt: resolvedTtl === null ? null : Date.now() + resolvedTtl }
      memory.set(key, entry)
      if (persist) writeDisk(key, entry)
      return value
    })
    .finally(() => { inFlight.delete(key) })

  inFlight.set(key, promise)
  return promise
}
