// The Gorave brand, one place for every logo file. Masters (SVG and 1024px
// PNG) live in assets/svg and assets/png; these are phone-sized copies.
//
//   Seal        the "g" in the scalloped seal. App icon, headers, QR centres.
//   Wordmark    "gorave" set heavy. Headers and the splash.
//   Sticker     the tilted cream wordmark with a coral shadow. Welcome, share cards.
//   Lockup      seal + wordmark side by side. Wide spots (about, share cards).

/** Gradient seal (orange to coral), for dark backgrounds. */
export const Logo = require('../../assets/brand/seal.png')
/** Black seal, for light backgrounds (the cream QR paper, white share cards). */
export const LogoBlack = require('../../assets/brand/seal-black.png')
/** Cream seal, for photos and coloured backgrounds. */
export const LogoCream = require('../../assets/brand/seal-cream.png')

export const Wordmark = require('../../assets/brand/wordmark-cream.png')
export const WordmarkBlack = require('../../assets/brand/wordmark-black.png')
export const Sticker = require('../../assets/brand/sticker.png')
export const Lockup = require('../../assets/brand/lockup.png')

/** width / height of each, so they can be sized by height alone. */
export const BRAND_ASPECT = {
  wordmark: 2000 / 502,
  sticker: 2000 / 758,
  lockup: 2000 / 454,
} as const
