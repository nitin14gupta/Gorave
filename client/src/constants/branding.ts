/** The mark on a dark rounded tile (like the app icon). Reads on dark and light. */
export const Logo = require('../../assets/brand/seal.png')
/** Black ring + orange dot, for light backgrounds (the cream QR paper, white share cards). */
export const LogoBlack = require('../../assets/brand/seal-black.png')
/** All-cream mark, for photos, coloured backgrounds and watermarks. */
export const LogoCream = require('../../assets/brand/seal-cream.png')

export const Wordmark = require('../../assets/brand/wordmark-cream.png')
export const WordmarkBlack = require('../../assets/brand/wordmark-black.png')
export const Sticker = require('../../assets/brand/sticker.png')
export const Lockup = require('../../assets/brand/lockup.png')

/** width / height of each, so they can be sized by height alone. */
export const BRAND_ASPECT = {
  wordmark: 2875 / 703,
  sticker: 2.5326,
  lockup: 5.0705,
} as const
