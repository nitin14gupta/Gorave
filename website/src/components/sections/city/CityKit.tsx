'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { buildCityKit, type CityKit } from '@/lib/cityKit'

const FALLBACK = buildCityKit([])
const Ctx = createContext<CityKit>(FALLBACK)

/** Gives the city-page sections the real flyers and timeline (built on the server from API events). */
export function CityKitProvider({ kit, children }: { kit: CityKit; children: ReactNode }) {
  return <Ctx.Provider value={kit}>{children}</Ctx.Provider>
}

export const useCityKit = () => useContext(Ctx)
