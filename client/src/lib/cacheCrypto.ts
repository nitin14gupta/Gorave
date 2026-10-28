import * as SecureStore from 'expo-secure-store'
import { getRandomBytes } from 'expo-crypto'
import { gcm } from '@noble/ciphers/aes'

/**
 * Encryption for the private things the app saves on the phone (your chats
 * and your own profile), so they can't be read straight out of app storage.
 *
 * AES-256-GCM with a random key made once per install and kept in the
 * system keystore (iOS Keychain / Android Keystore via SecureStore), never
 * next to the data. Logging out deletes the key, so anything left behind is
 * unreadable. If the keystore ever fails, nothing is saved at all; there is
 * no plain-text fallback.
 */

const KEY_NAME = 'gorave_cache_key_v1'
const PREFIX = 'enc1:'
let keyPromise: Promise<Uint8Array> | null = null

function utf8Encode(str: string): Uint8Array {
  const out: number[] = []
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i)
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1)
      if (next >= 0xdc00 && next <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (next - 0xdc00)
        i++
      }
    }
    if (c < 0x80) out.push(c)
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63))
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63))
  }
  return Uint8Array.from(out)
}

function utf8Decode(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length;) {
    const b = bytes[i++]
    let c: number
    if (b < 0x80) c = b
    else if (b < 0xe0) c = ((b & 31) << 6) | (bytes[i++] & 63)
    else if (b < 0xf0) c = ((b & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63)
    else c = ((b & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63)
    out += String.fromCodePoint(c)
  }
  return out
}

function toBase64(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

function fromBase64(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function getKey(): Promise<Uint8Array> {
  if (!keyPromise) {
    keyPromise = (async () => {
      const saved = await SecureStore.getItemAsync(KEY_NAME)
      if (saved) return fromBase64(saved)
      const key = getRandomBytes(32)
      // Readable after the first unlock, so background work (push, prefetch) still can.
      await SecureStore.setItemAsync(KEY_NAME, toBase64(key), { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK })
      return key
    })().catch(e => {
      keyPromise = null
      throw e
    })
  }
  return keyPromise
}

export function isEncrypted(stored: string): boolean {
  return stored.startsWith(PREFIX)
}

export async function encryptText(plain: string): Promise<string> {
  const key = await getKey()
  const nonce = getRandomBytes(12)
  const sealed = gcm(key, nonce).encrypt(utf8Encode(plain))
  const out = new Uint8Array(nonce.length + sealed.length)
  out.set(nonce)
  out.set(sealed, nonce.length)
  return PREFIX + toBase64(out)
}

/** null if it isn't ours, was made with another key, or was tampered with. */
export async function decryptText(stored: string): Promise<string | null> {
  if (!isEncrypted(stored)) return null
  try {
    const key = await getKey()
    const bytes = fromBase64(stored.slice(PREFIX.length))
    return utf8Decode(gcm(key, bytes.subarray(0, 12)).decrypt(bytes.subarray(12)))
  } catch {
    return null
  }
}

/** Logout: without the key, whatever is still on disk can't be read. */
export async function forgetCacheKey(): Promise<void> {
  keyPromise = null
  try { await SecureStore.deleteItemAsync(KEY_NAME) } catch {}
}
