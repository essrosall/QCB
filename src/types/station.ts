export type Station = {
  id: string
  name: string
  order: number
  direction: 'northbound' | 'southbound' | 'both'
  latitude?: number
  longitude?: number
}
