import type { LatLngExpression } from 'leaflet'
import type { Coordinates } from '../types/location'

type RoutePoint = [latitude: number, longitude: number]

function asRoutePoint(point: LatLngExpression): RoutePoint {
  if (Array.isArray(point)) {
    return [Number(point[0]), Number(point[1])]
  }

  if ('lat' in point && 'lng' in point) {
    return [point.lat, point.lng]
  }

  throw new Error('Unsupported route point format')
}

function squaredDistance(point: Coordinates, candidate: Coordinates) {
  const latitudeScale = 111_320
  const longitudeScale =
    111_320 * Math.cos((point.latitude * Math.PI) / 180)
  const latitudeDistance =
    (candidate.latitude - point.latitude) * latitudeScale
  const longitudeDistance =
    (candidate.longitude - point.longitude) * longitudeScale

  return latitudeDistance ** 2 + longitudeDistance ** 2
}

export function snapToRoute(
  point: Coordinates,
  route: LatLngExpression[],
): Coordinates {
  if (route.length === 0) {
    throw new Error('Cannot snap a point to an empty route')
  }

  let closest = asRoutePoint(route[0])
  let closestDistance = squaredDistance(point, {
    latitude: closest[0],
    longitude: closest[1],
  })

  for (let index = 1; index < route.length; index += 1) {
    const start = asRoutePoint(route[index - 1])
    const end = asRoutePoint(route[index])
    const latitudeDelta = end[0] - start[0]
    const longitudeDelta = end[1] - start[1]
    const segmentLengthSquared =
      latitudeDelta ** 2 + longitudeDelta ** 2
    const position =
      segmentLengthSquared === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              ((point.latitude - start[0]) * latitudeDelta +
                (point.longitude - start[1]) * longitudeDelta) /
                segmentLengthSquared,
            ),
          )
    const candidate: RoutePoint = [
      start[0] + latitudeDelta * position,
      start[1] + longitudeDelta * position,
    ]
    const candidateDistance = squaredDistance(point, {
      latitude: candidate[0],
      longitude: candidate[1],
    })

    if (candidateDistance < closestDistance) {
      closest = candidate
      closestDistance = candidateDistance
    }
  }

  return { latitude: closest[0], longitude: closest[1] }
}
