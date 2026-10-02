import type { Coordinates } from '../types/location'
import type { WalkingRoute } from '../types/route'

function decodePolyline(encoded: string): Coordinates[] {
  const points: Coordinates[] = []
  let index = 0
  let latitude = 0
  let longitude = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte: number
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    latitude += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0
    result = 0
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)
    longitude += result & 1 ? ~(result >> 1) : result >> 1

    points.push({
      latitude: latitude / 1e6,
      longitude: longitude / 1e6,
    })
  }

  return points
}

export async function getWalkingRoute(
  from: Coordinates,
  to: Coordinates,
  signal?: AbortSignal,
): Promise<WalkingRoute> {
  return getTravelRoute(from, to, 'pedestrian', signal)
}

export async function getTravelRoute(
  from: Coordinates,
  to: Coordinates,
  costing: 'pedestrian' | 'motor_scooter' | 'bus',
  signal?: AbortSignal,
): Promise<WalkingRoute> {
  const response = await fetch('https://valhalla1.openstreetmap.de/route', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: [
        { lat: from.latitude, lon: from.longitude },
        { lat: to.latitude, lon: to.longitude },
      ],
      costing,
      units: 'kilometers',
    }),
  })

  if (!response.ok) {
    throw new Error('Walking route service unavailable')
  }

  const result = (await response.json()) as {
    trip?: {
      summary?: { length?: number; time?: number }
      legs?: Array<{ shape?: string }>
    }
  }
  const summary = result.trip?.summary
  const shape = result.trip?.legs?.[0]?.shape

  if (
    summary?.length === undefined ||
    summary.time === undefined ||
    !shape
  ) {
    throw new Error('Walking route was not found')
  }

  return {
    coordinates: decodePolyline(shape),
    distanceMeters: summary.length * 1000,
    durationMinutes: Math.max(1, Math.round(summary.time / 60)),
  }
}
