import { Team } from '@/components/sections/evergreen/about/Founders'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { Ctas } from '@/components/sections/areaType/kit'
import { Chapter } from '@/components/ui/atoms'
import { FoundersHero } from './FoundersHero'
import { Journey } from './Journey'
import { Why } from './Why'
import { Next } from './Next'

/**
 * /founders, the journey. The empty apartment, the quiet party, the
 * "Baburao" call, the two of them, why, and what's next.
 */
export function FoundersPageView() {
  return (
    <>
      <main className="bg-cream">
        <FoundersHero />
        <Journey />
        <Team n="02" title="The two of us" />
        <Why />
        <Next />
        <section className="bg-cream px-6 py-24 text-center md:px-12 md:py-32 lg:px-20">
          <Chapter n="05" title="Come through" className="justify-center" />
          <h2 className="mx-auto mt-6 max-w-[900px] font-display text-[clamp(48px,7vw,116px)] font-extrabold leading-[0.88] tracking-[-0.065em]">
            Come to
            <span className="font-serif font-normal italic tracking-[-0.03em] text-brand"> the first one.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[460px] font-sans text-lg leading-relaxed text-ink-2">Find a night, or open your door and host one. We’ll probably be there.</p>
          <Ctas className="mt-9 items-center" />
        </section>
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
