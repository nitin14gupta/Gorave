import { create } from 'zustand'

export type Theme = 'dark' | 'light'

// Same key the inline script in layout.tsx reads before first paint, so the
// page never flashes the wrong theme.
export const THEME_KEY = 'gorave-admin-theme'

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try { localStorage.setItem(THEME_KEY, theme) } catch {}
}

interface ThemeState {
  theme: Theme
  toggle: () => void
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  // Read whatever the inline script already applied.
  theme: typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    apply(next)
    set({ theme: next })
  },
}))
