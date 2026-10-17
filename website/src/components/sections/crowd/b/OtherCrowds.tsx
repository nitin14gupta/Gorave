import Image from 'next/image'
import Link from 'next/link'
import { Chapter } from '@/components/ui/atoms'
import { pad } from './kit'

interface Props {
  others: { slug: string; label: string; href: string; promise: string; image: string }[]
  place: { name: string }
  chapter?: string
}

/**
 * Chapter 07, other crowds. Tall photo panels side by side; the one you
 * hover widens (flex-grow) while its neighbours narrow, the photo settles
 * and its promise slides up. Mobile stacks them.
 */
export function OtherCrowds({ others, place, chapter = '07' }: Props) {
  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1320px]">
        <Chapter n={chapter} title="Other crowds" />
        <h2 className="mt-4 font-display text-[clamp(44px,6vw,92px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
          Another kind of room<span className="font-serif font-normal italic tracking-[-0.03em] text-brand"> in {place.name}</span>.
        </h2>
        <div className="mt-12 flex flex-col gap-4 md:mt-16 md:h-[560px] md:flex-row">
          {others.map((o, i) => (
            <Link
              key={o.slug}
              href={o.href}
              className="group relative h-[380px] overflow-hidden rounded-[28px] bg-ink md:h-auto md:min-w-0 md:flex-1 md:transition-[flex-grow] md:duration-700 md:ease-out-expo md:hover:flex-[2.1] md:focus-visible:flex-[2.1]"
            >
              <Image
                src={o.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-[1100ms] ease-out-expo md:scale-[1.18] md:group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-ink/0 transition-opacity duration-700 md:group-hover:opacity-80" />
              <div className="absolute left-6 top-6 font-serif text-2xl italic text-cream/80">{pad(i + 1)}</div>
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <div className="font-display text-[clamp(36px,3.6vw,60px)] font-extrabold leading-[0.92] tracking-[-0.05em] text-cream">{o.label}</div>
                <div className="mt-2 flex items-center gap-2 font-sans text-base font-bold text-cream/85 transition-[opacity,transform] duration-500 ease-out-expo md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100">
                  {o.promise} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
