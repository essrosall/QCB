import { useCallback, useState } from 'react'
import type { Coordinates } from '../types/location'

type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error'

const errorMessages: Record<number, string> = {
  1: 'Location permission was denied. You can search for a place instead.',
  2: 'Your location is currently unavailable. Check your device settings.',
  3: 'Location took too long to respond. Please try again.',
}

export function useGeolocation() {
  const [location, setLocation] = useState<Coordinates | null>(null)
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      setError('This browser does not support location. You can search for a place instead.')
      return
    }

    setStatus('loading')
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setStatus('success')
      },
      (positionError) => {
        setStatus('error')
        setError(
          errorMessages[positionError.code] ??
            'We could not determine your location. You can search for a place instead.',
        )
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    )
  }, [])

  return { location, status, error, requestLocation }
}
