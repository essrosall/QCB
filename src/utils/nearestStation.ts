import type { Station } from '../types/station'
import type { Coordinates } from '../types/location'
import { distanceInMeters } from './distance'
import { snapToRoute } from './snapToRoute'
import { carouselRoute } from '../data/carouselRoute'

export function findNearestStation(
  location: Coordinates,
  stationList: Station[],
) {
  return stationList
    .filter(
      (station): station is Station & Required<Pick<Station, 'latitude' | 'longitude'>> =>
        station.latitude !== undefined && station.longitude !== undefined,
    )
    .map((station) => ({
      station,
      distance: distanceInMeters(
        location,
        snapToRoute(
          {
            latitude: station.latitude,
            longitude: station.longitude,
          },
          carouselRoute,
        ),
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0]
}
