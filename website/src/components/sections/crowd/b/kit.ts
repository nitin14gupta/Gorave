// Shared bits for crowd variant B ("Editorial scrollytelling").

export const EASE = [0.2, 0.8, 0.2, 1] as const
export const EASE_CSS = 'cubic-bezier(.2,.8,.2,1)'

/** "01", "02"... for editorial numbering. */
export const pad = (n: number) => String(n).padStart(2, '0')

/** Display-safe rounding for any number that ends up in an SSR'd inline style. */
export const r2 = (n: number) => Math.round(n * 100) / 100
