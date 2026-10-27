// Chart palette for the admin's light and dark themes.
export function chartColors() {
  // CSS variables, so charts follow the light / dark theme with no re-render.
  return {
    surface: 'var(--c-surface)',
    textSecondary: 'var(--c-ink-2)',
    muted: 'var(--c-ink-3)',
    gridline: 'var(--c-divider)',
    baseline: 'var(--c-border)',
    series1: '#FF6B35', // brand orange, chart data series, not a UI fill
    series2: 'var(--c-blue)',
    good: 'var(--c-green)',
    warning: 'var(--c-gold)',
    critical: 'var(--c-destructive)',
  }
}

export const STATUS_COLOR: Record<string, string> = {
  open: 'var(--c-gold)',
  resolved: 'var(--c-green)',
  closed: 'var(--c-ink-3)',
}
