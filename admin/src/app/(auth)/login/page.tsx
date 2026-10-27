'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { ThemeLogo } from '@/components/ui/ThemeLogo'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

// Party posters from the app's Welcome wall, tilted like invites on a table.
const POSTERS = [
  { src: '/img/posters/dj-night.webp', rotate: -8, x: '6%', y: '10%', z: 1 },
  { src: '/img/posters/girls-night.webp', rotate: 5, x: '40%', y: '4%', z: 2 },
  { src: '/img/posters/confetti.webp', rotate: -3, x: '20%', y: '40%', z: 3 },
  { src: '/img/posters/the-squad.webp', rotate: 9, x: '54%', y: '44%', z: 2 },
]

/** Big-type field on an underline, like the app's sign-in. */
const FIELD =
  'w-full bg-transparent py-2 font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink-primary outline-none placeholder:text-ink-disabled'

/**
 * Admin sign-in, in the app's sign-in style: a big "Welcome back", email and
 * password as big type on an underline, a show/hide eye, and on wide screens
 * a wall of party posters with a warm line. Auth logic is unchanged.
 */
export default function LoginPage() {
  const router = useRouter()
  const { login } = useAdminAuth()
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginForm) => {
    setSubmitting(true)
    try {
      await login(values.email, values.password)
      router.replace('/')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen flex-1 bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* The night, on the left (wide screens only) */}
      <aside className="relative hidden overflow-hidden bg-near-black lg:block">
        {POSTERS.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.src}
            src={p.src}
            alt=""
            className="absolute w-[38%] rounded-2xl object-cover shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]"
            style={{ left: p.x, top: p.y, aspectRatio: '4 / 5', transform: `rotate(${p.rotate}deg)`, zIndex: p.z }}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />
        <div className="absolute inset-x-10 bottom-10 z-20 text-white">
          <p className="font-display text-[44px] font-extrabold leading-[0.95] tracking-[-0.04em]">The night shift.</p>
          <p className="mt-3 max-w-[380px] font-sans text-lg text-white/80">Keep Gorave safe and running, so every Saturday goes to plan.</p>
        </div>
      </aside>

      {/* Sign in */}
      <main className="relative flex items-center justify-center px-6 py-14">
        <ThemeToggle className="absolute right-5 top-5" />
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-2.5">
            <ThemeLogo className="h-9 w-9" />
            <span className="font-display text-xl font-extrabold tracking-[-0.02em] text-ink-primary">gorave</span>
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-secondary">Admin</span>
          </div>

          <h1 className="mt-10 font-display text-[44px] font-extrabold leading-[1] tracking-[-0.045em] text-ink-primary">Welcome back</h1>
          <p className="mt-3 font-sans text-[15px] text-ink-secondary">Sign in with your admin email.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-10 flex flex-col gap-8">
            <div>
              <label htmlFor="email" className="block font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-secondary">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@gorave.in"
                aria-invalid={!!errors.email}
                className={cn(FIELD, 'text-[22px]')}
                {...register('email')}
              />
              <div className={cn('h-0.5 rounded-full', errors.email ? 'bg-destructive' : 'bg-divider')} />
              {errors.email && <p className="mt-2 font-sans text-sm font-medium text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-secondary">Password</label>
              <div className="flex items-center gap-2">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  className={FIELD}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-secondary hover:bg-surface hover:text-ink-primary"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className={cn('h-0.5 rounded-full', errors.password ? 'bg-destructive' : 'bg-divider')} />
              {errors.password && <p className="mt-2 font-sans text-sm font-medium text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
              Sign in
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
