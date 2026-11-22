import localFont from 'next/font/local'

// Bricolage Grotesque for headings (the logo's face), Figtree for text.
// Same fixed-weight cuts as the app and website (docs/brand/cut_fonts.py).
export const bricolage = localFont({
  src: [
    { path: '../fonts/BricolageGrotesque-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/BricolageGrotesque-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/BricolageGrotesque-ExtraBold.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-bricolage',
  display: 'swap',
})

export const figtree = localFont({
  src: [
    { path: '../fonts/Figtree-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/Figtree-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/Figtree-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../fonts/Figtree-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-figtree',
  display: 'swap',
})
