// Generates the sample ticket QR used on the marketing site.
// It is a real, scannable code (high error correction so the logo in the
// centre doesn't break it). Run: node scripts/generate-ticket-qr.mjs
import QRCode from 'qrcode'
import { writeFileSync } from 'node:fs'

const TICKET_URL = 'https://gorave.in'
const svg = await QRCode.toString(TICKET_URL, {
  type: 'svg',
  errorCorrectionLevel: 'H',
  margin: 0,
  color: { dark: '#171310', light: '#00000000' },
})
writeFileSync(new URL('../public/img/ticket-qr.svg', import.meta.url), svg)
console.log('wrote public/img/ticket-qr.svg for', TICKET_URL)
