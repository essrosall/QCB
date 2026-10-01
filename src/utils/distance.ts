import type { Coordinates } from '../types/location'

const earthRadiusMeters = 6_371_000

export function distanceInMeters(from: Coordinates, to: Coordinates) {
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180
  const fromLatitude = (from.latitude * Math.PI) / 180
  const toLatitude = (to.latitude * Math.PI) / 180

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 *
      Math.cos(fromLatitude) *
      Math.cos(toLatitude)

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
