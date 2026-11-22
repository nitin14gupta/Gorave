// The brand's type roles, for inline styles (SVG text, canvas, charts) where a
// Tailwind class can't reach. Same roles as the app's FontFamily.
//
// These point at the semantic CSS variables in globals.css, never at a font's
// name, so swapping a typeface means changing only app/layout.tsx (the files)
// and globals.css (which variable each role uses).
//
//   display  Bricolage Grotesque, the logo's face. Headings, big numbers.
//   body     Figtree. Everything you read.
//   serif    Instrument Serif. The odd italic accent.
export const FONT = {
  display: 'var(--font-display)',
  body: 'var(--font-sans)',
  serif: 'var(--font-serif)',
} as const
