export interface CityOption { name: string; state: string }

export interface CityViewProps {
  cities: CityOption[]
  query: string
  onQuery: (q: string) => void
  selected: string | null
  onSelect: (name: string) => void
  detecting: boolean
  onDetect: () => void
  saving: boolean
  onSave: () => void
  onBack: () => void
}
