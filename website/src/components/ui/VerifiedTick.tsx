/** The verified tick: a person at Gorave checked and approved this person's government ID. */
export function VerifiedTick({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} aria-label="ID verified" role="img">
      <path
        fill="currentColor"
        d="M12 1.5l2.6 1.9 3.2-.2 1 3.1 2.6 1.9-1 3.1 1 3.1-2.6 1.9-1 3.1-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3.1L2.6 15.8l1-3.1-1-3.1 2.6-1.9 1-3.1 3.2.2z"
      />
      <path fill="none" stroke="var(--color-paper, #fff)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M8 12.2l2.7 2.7L16.2 9.4" />
    </svg>
  )
}
