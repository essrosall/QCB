import type { Coordinates } from './location'

export type WalkingRoute = {
  coordinates: Coordinates[]
  distanceMeters: number
  durationMinutes: number
}
