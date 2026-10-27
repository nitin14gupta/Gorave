import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, label, hint }: { icon: LucideIcon; label: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-divider px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-ink-secondary">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-display text-lg font-bold text-ink-primary">{label}</p>
      {hint ? <p className="max-w-[360px] font-sans text-sm text-ink-secondary">{hint}</p> : null}
    </div>
  )
}
