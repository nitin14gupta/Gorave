'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-sans font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 disabled:pointer-events-none active:scale-[0.97]',
  {
    variants: {
      variant: {
        // Same as the website's primary button: brand gradient, one-shot shine on hover.
        primary:
          'btn-shine font-bold text-white glow-shadow-brand hover:-translate-y-px disabled:bg-divider disabled:bg-none disabled:text-ink-disabled disabled:shadow-none',
        // The website's ghost button: a soft inset ring, no fill.
        secondary:
          'bg-transparent text-ink-primary shadow-[inset_0_0_0_1.5px_var(--c-glass-border-thick)] hover:bg-glass-surface disabled:opacity-50',
        ghost: 'bg-transparent text-ink-secondary hover:bg-surface hover:text-ink-primary disabled:opacity-50',
        destructive: 'bg-destructive font-bold text-white hover:brightness-110 disabled:opacity-50',
        outline: 'bg-transparent text-ink-primary shadow-[inset_0_0_0_1.5px_var(--c-glass-border-thick)] hover:bg-glass-surface disabled:opacity-50',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-[15px]',
        lg: 'h-14 px-7 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
)
Button.displayName = 'Button'
