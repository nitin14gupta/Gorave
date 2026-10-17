import type { AboutProps } from '../types'
import { AboutPageA } from './AboutPageA'

// /about: the "Why we exist" manifesto (variant A, picked in the lab).
export function AboutPageView(props: AboutProps) {
  return <AboutPageA {...props} />
}
