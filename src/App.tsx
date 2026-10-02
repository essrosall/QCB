import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import L from 'leaflet'
import { carouselRoute } from './data/carouselRoute'
import { stations } from './data/stations'
import type { Coordinates } from './types/location'
import type { WalkingRoute } from './types/route'
import type { Station } from './types/station'
import { findNearestStation } from './utils/nearestStation'
import { snapToRoute } from './utils/snapToRoute'
import { getTravelRoute } from './services/walkingRoute'
import { useGeolocation } from './hooks/useGeolocation'
import { distanceInMeters } from './utils/distance'
import './App.css'

type SearchResult = {
  display_name: string
  lat: string
  lon: string
}

function HelpView() {
  return (
    <section className="content-view help-view">
      <p className="eyebrow">Safety and support</p>
      <h2>Help while riding</h2>
      <p className="intro-copy">
        Keep these contacts and simple safety reminders available during your
        EDSA Busway trip.
      </p>

      <div className="help-grid">
        <article className="help-card help-card-primary">
          <p className="eyebrow">Immediate danger</p>
          <h3>Call 911</h3>
          <p>For urgent police, fire, or medical assistance anywhere in the Philippines.</p>
          <a href="tel:911">Call 911</a>
        </article>
        <article className="help-card">
          <p className="eyebrow">Traffic and road concerns</p>
          <h3>MMDA hotline</h3>
          <p>For traffic incidents, road obstructions, and transport concerns along Metro Manila routes.</p>
          <a href="tel:136">Call 136</a>
        </article>
      </div>

      <div className="help-sections">
        <article>
          <h3>If you need assistance</h3>
          <ol>
            <li>Move to a visible, well-lit area or ask station staff for help.</li>
            <li>Share the nearest stop name or number and your direction of travel.</li>
            <li>For a medical emergency, call 911 and follow the operator's instructions.</li>
          </ol>
        </article>
        <article>
          <h3>Keep your trip safer</h3>
          <ul>
            <li>Use designated boarding areas and wait behind safety markings.</li>
            <li>Keep phones and bags secure, especially while boarding.</li>
            <li>Check official advisories when weather or service conditions change.</li>
          </ul>
        </article>
      </div>

      <p className="help-note">
        Hotline availability and operating procedures can change. Confirm current
        contacts with official MMDA, DOTr, and LTFRB channels when possible.
      </p>
    </section>
  )
}

type AppView = 'map' | 'fare' | 'guide' | 'help'
type Discount = 'regular' | 'discounted'
type TransportMode = 'walking' | 'motorcycle' | 'bus' | 'jeepney' | 'mixed'

const faqs = [
  {
    question: 'What route does the EDSA Carousel serve?',
    answer:
      'The Busway connects Monumento and PITX through the EDSA corridor, with designated stops and terminals along the route.',
  },
  {
    question: 'Who can get a fare discount?',
    answer:
      'Students, senior citizens, and persons with disabilities may receive 20% off when they present a valid ID.',
  },
  {
    question: 'How does the fare work?',
    answer:
      'The planning reference uses a distance-based fare: ₱15 for the first 5 kilometers, plus ₱2.65 for each succeeding kilometer. Confirm the current fare before boarding.',
  },
  {
    question: 'What payment methods can I use?',
    answer:
      'Cash and Beep are commonly used. E-wallet or QR payment availability can vary by station and operator.',
  },
  {
    question: 'Does the Busway run on a dedicated lane?',
    answer:
      'The service is designed around dedicated bus lanes and designated median or curbside boarding areas. Follow station staff and current advisories.',
  },
  {
    question: 'Can I transfer to rail lines?',
    answer:
      'Several stops connect with LRT-1, LRT-2, MRT-3, and other public transport routes. A transfer may require a separate fare transaction.',
  },
  {
    question: 'Does the fare change during the day?',
    answer:
      'The fare is distance-based rather than time-based. Fares may change when official LTFRB directives are issued.',
  },
]

function FareMap({ fromId, toId }: { fromId: string; toId: string }) {
  const mapElement = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapElement.current) {
      return
    }

    const from = stations.find((station) => station.id === fromId)
    const to = stations.find((station) => station.id === toId)
    const map = L.map(mapElement.current, { zoomControl: false })
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    L.polyline(carouselRoute, {
      color: '#171717',
      weight: 5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map)

    const selectedPoints: L.LatLngExpression[] = []
    ;[
      { station: from, label: 'From', tone: 'from' },
      { station: to, label: 'To', tone: 'to' },
    ].forEach(({ station, label, tone }) => {
      if (station?.latitude === undefined || station.longitude === undefined) {
        return
      }
      const point = snapToRoute(
        { latitude: station.latitude, longitude: station.longitude },
        carouselRoute,
      )
      selectedPoints.push([point.latitude, point.longitude])
      L.marker([point.latitude, point.longitude], {
        icon: L.divIcon({
          className: `fare-map-marker ${tone}`,
          html: `<span>${label}</span>`,
          iconSize: [42, 24],
          iconAnchor: [21, 12],
        }),
      }).addTo(map)
    })

    map.fitBounds(
      selectedPoints.length > 1
        ? L.latLngBounds(selectedPoints)
        : L.latLngBounds(carouselRoute),
      { padding: [34, 34], maxZoom: 14 },
    )

    return () => {
      map.remove()
    }
  }, [fromId, toId])

  return <div className="fare-map" ref={mapElement} aria-label="Fare trip map" />
}

function StationPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const station = stations.find((item) => item.id === value)

  return (
    <div className="station-picker">
      <span className="picker-label">{label}</span>
      <button
        className="picker-button"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span>{station?.name}</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="picker-menu" role="listbox" aria-label={`${label} station`}>
          {stations.map((item) => (
            <button
              type="button"
              role="option"
              aria-selected={item.id === value}
              key={item.id}
              onClick={() => {
                onChange(item.id)
                setOpen(false)
              }}
            >
              <span className="picker-number">{item.order}</span>
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function FareView() {
  const [fromId, setFromId] = useState(stations[0].id)
  const [toId, setToId] = useState(stations[stations.length - 1].id)
  const [discount, setDiscount] = useState<Discount>('regular')
  const from = stations.find((station) => station.id === fromId)
  const to = stations.find((station) => station.id === toId)
  const distance = from && to
    ? distanceInMeters(
        { latitude: from.latitude ?? 0, longitude: from.longitude ?? 0 },
        { latitude: to.latitude ?? 0, longitude: to.longitude ?? 0 },
      ) / 1000
    : 0
  const baseFare = distance <= 5 ? 15 : 15 + (distance - 5) * 2.65
  const fare = discount === 'discounted' ? baseFare * 0.8 : baseFare
  const fromOrder = from?.order ?? 1
  const toOrder = to?.order ?? stations.length
  const stopCount = Math.abs(toOrder - fromOrder)
  const direction = toOrder >= fromOrder ? 'Southbound' : 'Northbound'
  const busEtaMinutes = Math.max(5, Math.round((distance / 25) * 60))

  return (
    <section className="content-view fare-view">
      <div className="fare-heading">
        <p className="eyebrow">Plan your trip</p>
        <h2>Fare estimate</h2>
        <p className="intro-copy">
          Choose your stops to see the route, ETA, and estimated passenger fare.
        </p>
      </div>
      <div className="fare-layout">
        <div className="fare-map-column">
          <FareMap fromId={fromId} toId={toId} />
          <div className="fare-route-label">
            <span>{from?.name}</span>
            <span aria-hidden="true">→</span>
            <span>{to?.name}</span>
          </div>
        </div>
        <div className="fare-details-column">
          <div className="fare-form">
            <div className="picker-row">
              <StationPicker label="From" value={fromId} onChange={setFromId} />
              <button
                className="swap-button"
                type="button"
                aria-label="Swap origin and destination"
                onClick={() => {
                  setFromId(toId)
                  setToId(fromId)
                }}
              >
                ⇄
              </button>
              <StationPicker label="To" value={toId} onChange={setToId} />
            </div>
        <fieldset>
          <legend>Passenger type</legend>
          <label className="radio-option">
            <input type="radio" checked={discount === 'regular'} onChange={() => setDiscount('regular')} />
            Regular passenger
          </label>
          <label className="radio-option">
            <input type="radio" checked={discount === 'discounted'} onChange={() => setDiscount('discounted')} />
            Student / senior / PWD (20% off)
          </label>
        </fieldset>
      </div>
      <div className="fare-result">
        <div className="fare-result-header">
          <div>
            <span>Estimated fare</span>
            <strong>₱{fare.toFixed(2)}</strong>
          </div>
          <div className="fare-direction">{direction}</div>
        </div>
        <div className="fare-trip-details">
          <div>
            <span>Bus travel</span>
            <strong>About {busEtaMinutes} min</strong>
          </div>
          <div>
            <span>Route distance</span>
            <strong>{distance.toFixed(1)} km</strong>
          </div>
          <div>
            <span>Stops between</span>
            <strong>{stopCount} {stopCount === 1 ? 'stop' : 'stops'}</strong>
          </div>
        </div>
        <small>
          {discount === 'discounted' ? '20% discount applied' : 'Regular passenger fare'} ·
          &nbsp;Travel time is an estimate and can change with boarding, traffic, and station conditions.
        </small>
      </div>
      <div className="fare-info-grid">
        <div>
          <span>Service</span>
          <strong>Monumento ↔ PITX</strong>
        </div>
        <div>
          <span>Operating hours</span>
          <strong>Reference: 4:00 AM–11:00 PM</strong>
        </div>
        <div>
          <span>Payment</span>
          <strong>Cash or Beep where available</strong>
        </div>
        <div>
          <span>Discount</span>
          <strong>Valid ID required for eligible passengers</strong>
        </div>
      </div>
      <p className="fine-print">
        Estimate based on ₱15 for the first 5 km plus ₱2.65 per succeeding km.
        Present a valid ID for eligible discounts. Confirm the current fare before boarding.
      </p>
        </div>
      </div>
    </section>
  )
}

function GuideView() {
  return (
    <section className="content-view guide-view">
      <p className="eyebrow">Commuter guide</p>
      <h2>EDSA Busway FAQs</h2>
      <p className="intro-copy">
        Quick information for planning a trip between Monumento and PITX.
      </p>
      <div className="faq-list">
        {faqs.map((faq) => (
          <details key={faq.question}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
      <div className="guide-note">
        <strong>Before you ride</strong>
        <p>Use designated stops, keep your belongings secure, and follow current DOTr and LTFRB advisories.</p>
      </div>
    </section>
  )
}

function MapView({
  location,
  nearestStation,
  onWalkingRoute,
  onStationSelect,
  onMapLocationSelect,
  transportMode,
}: {
  location: Coordinates | null
  nearestStation: Station | null
  onWalkingRoute: (route: WalkingRoute | null, error: string | null) => void
  onStationSelect: (station: Station) => void
  onMapLocationSelect: (point: Coordinates) => void
  transportMode: TransportMode
}) {
  const mapElement = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const userMarker = useRef<L.Marker | null>(null)
  const nearestMarker = useRef<L.CircleMarker | null>(null)
  const walkingLine = useRef<L.Polyline | null>(null)

  useEffect(() => {
    if (!mapElement.current) {
      return
    }

    const leafletMap = L.map(mapElement.current, {
      zoomControl: false,
    })
    map.current = leafletMap
    leafletMap.on('click', (event) => {
      onMapLocationSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      })
    })

    L.control.zoom({ position: 'bottomright' }).addTo(leafletMap)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(leafletMap)

    const routeBounds = L.latLngBounds(carouselRoute)
    leafletMap.fitBounds(routeBounds, { padding: [28, 28] })

    L.polyline(carouselRoute, {
      color: '#171717',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(leafletMap)

    L.polyline(carouselRoute, {
      color: '#ffffff',
      weight: 1.5,
      opacity: 0.9,
      dashArray: '2 8',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(leafletMap)

    stations.forEach((station) => {
      if (station.latitude === undefined || station.longitude === undefined) {
        return
      }

      const stationLocation = snapToRoute(
        { latitude: station.latitude, longitude: station.longitude },
        carouselRoute,
      )
      const marker = L.marker(
        [stationLocation.latitude, stationLocation.longitude],
        {
        icon: L.divIcon({
          className: `station-marker station-marker-${(station.order - 1) % 5}`,
          html: `<span>${station.order}</span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
        },
      ).addTo(leafletMap)

      marker.bindTooltip(`${station.order}. ${station.name}`, {
        direction: 'top',
        offset: [0, -5],
      })
      marker.on('click', () => onStationSelect(station))
    })

    return () => {
      leafletMap.remove()
      map.current = null
    }
  }, [onMapLocationSelect, onStationSelect])

  useEffect(() => {
    if (!map.current || !location) {
      userMarker.current?.remove()
      userMarker.current = null
      return
    }

    userMarker.current?.remove()
    const modeIcon = transportMode === 'walking'
      ? '♙'
      : transportMode === 'motorcycle'
        ? '♢'
        : transportMode === 'mixed'
          ? '⇄'
          : '▰'
    userMarker.current = L.marker(
      [location.latitude, location.longitude],
      {
        icon: L.divIcon({
          className: `location-marker location-marker-${transportMode}`,
          html: `<span>${modeIcon}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
      },
    )
      .bindTooltip(`${transportMode === 'walking' ? 'Walking' : transportMode} starting point`, {
        direction: 'top',
        offset: [0, -8],
      })
      .addTo(map.current)

    map.current.setView([location.latitude, location.longitude], 14, {
      animate: true,
    })
  }, [location, transportMode])

  useEffect(() => {
    if (
      !map.current ||
      nearestStation?.latitude === undefined ||
      nearestStation.longitude === undefined
    ) {
      nearestMarker.current?.remove()
      nearestMarker.current = null
      return
    }

    const stationLocation = snapToRoute(
      {
        latitude: nearestStation.latitude,
        longitude: nearestStation.longitude,
      },
      carouselRoute,
    )
    nearestMarker.current?.remove()
    nearestMarker.current = L.circleMarker(
      [stationLocation.latitude, stationLocation.longitude],
      {
        radius: 10,
        color: '#171717',
        weight: 3,
        fillColor: '#ffffff',
        fillOpacity: 1,
      },
    )
      .bindTooltip(`Nearest: ${nearestStation.name}`, {
        direction: 'top',
        offset: [0, -10],
        permanent: true,
      })
      .addTo(map.current)

    return () => {
      nearestMarker.current?.remove()
      nearestMarker.current = null
    }
  }, [nearestStation])

  useEffect(() => {
    if (
      !map.current ||
      !location ||
      nearestStation?.latitude === undefined ||
      nearestStation.longitude === undefined
    ) {
      walkingLine.current?.remove()
      walkingLine.current = null
      onWalkingRoute(null, null)
      return
    }

    const stationLocation = snapToRoute(
      {
        latitude: nearestStation.latitude,
        longitude: nearestStation.longitude,
      },
      carouselRoute,
    )
    const controller = new AbortController()
    onWalkingRoute(null, null)

    const costing = transportMode === 'walking'
      ? 'pedestrian'
      : transportMode === 'motorcycle'
        ? 'motor_scooter'
        : 'bus'

    getTravelRoute(location, stationLocation, costing, controller.signal)
      .then((route) => {
        if (!map.current) {
          return
        }
        walkingLine.current?.remove()
        walkingLine.current = L.polyline(
          route.coordinates.map((point) => [
            point.latitude,
            point.longitude,
          ]),
          {
            color: transportMode === 'walking' ? '#171717' : '#555550',
            weight: 4,
            opacity: 0.75,
            dashArray: transportMode === 'walking' ? '7 7' : '12 8',
            lineCap: 'round',
          },
        ).addTo(map.current)
        onWalkingRoute(route, null)
      })
      .catch((routeError: Error) => {
        if (routeError.name !== 'AbortError') {
          onWalkingRoute(null, 'Walking route is unavailable right now.')
        }
      })

    return () => controller.abort()
  }, [location, nearestStation, onWalkingRoute, transportMode])

  return <div className="map-view" ref={mapElement} aria-label="Metro Manila map" />
}

function App() {
  const [activeView, setActiveView] = useState<AppView>('map')
  const { location, status, error, requestLocation } = useGeolocation()
  const [locationVisible, setLocationVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchActive, setSearchActive] = useState(false)
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null)
  const activeLocation = selectedLocation ?? (locationVisible ? location : null)
  const activeNearest = activeLocation
    ? findNearestStation(activeLocation, stations)
    : undefined
  const [walkingRoute, setWalkingRoute] = useState<WalkingRoute | null>(null)
  const [walkingRouteError, setWalkingRouteError] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [transportMode, setTransportMode] = useState<TransportMode>('walking')
  const handleWalkingRoute = useCallback(
    (route: WalkingRoute | null, routeError: string | null) => {
      setWalkingRoute(route)
      setWalkingRouteError(routeError)
    },
    [],
  )
  const handleStationSelect = useCallback((station: Station) => {
    setSelectedStation(station)
  }, [setSelectedStation])
  const handleMapLocationSelect = useCallback((point: Coordinates) => {
    setSelectedLocation(point)
    setSelectedStation(null)
    setSearchResults([])
    setSearchActive(false)
    setSearchError(null)
  }, [])
  const clearLocation = useCallback(() => {
    setSelectedLocation(null)
    setLocationVisible(false)
    setSelectedStation(null)
    setSearchQuery('')
    setSearchResults([])
    setSearchActive(false)
    setSearchError(null)
  }, [])

  const transportEstimate = activeNearest
    ? (() => {
        const distanceKm = Math.max(activeNearest.distance / 1000, 0.3)
        const estimates: Record<Exclude<TransportMode, 'walking'>, number> = {
          motorcycle: Math.max(4, Math.round((distanceKm / 24) * 60 + 3)),
          bus: Math.max(8, Math.round((distanceKm / 16) * 60 + 8)),
          jeepney: Math.max(8, Math.round((distanceKm / 13) * 60 + 7)),
          mixed: Math.max(12, Math.round((distanceKm / 14) * 60 + 12)),
        }
        return {
          distanceKm,
          minutes: transportMode === 'walking'
            ? walkingRoute?.durationMinutes ?? null
            : estimates[transportMode],
        }
      })()
    : null

  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 3) {
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setSearchStatus('loading')
      try {
        const params = new URLSearchParams({
          q: `${query}, Metro Manila, Philippines`,
          format: 'jsonv2',
          limit: '5',
        })
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          },
        )

        if (!response.ok) {
          throw new Error('Search service unavailable')
        }

        const results = (await response.json()) as SearchResult[]
        setSearchResults(results)
        setSearchActive(results.length > 0)
        setSearchStatus('idle')
      } catch (searchRequestError) {
        if (
          searchRequestError instanceof DOMException &&
          searchRequestError.name === 'AbortError'
        ) {
          return
        }
        setSearchStatus('error')
      }
    }, 350)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [searchQuery])

  function openWalkingNavigation() {
    const station = activeNearest?.station ?? selectedStation
    if (
      !station ||
      station.latitude === undefined ||
      station.longitude === undefined
    ) {
      return
    }

    const destination = snapToRoute(
      { latitude: station.latitude, longitude: station.longitude },
      carouselRoute,
    )
    const destinationQuery = `${destination.latitude},${destination.longitude}`
    const navigationUrl = activeLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${activeLocation.latitude},${activeLocation.longitude}&destination=${destinationQuery}&travelmode=walking`
      : `https://www.google.com/maps/search/?api=1&query=${destinationQuery}`

    window.open(navigationUrl, '_blank', 'noopener,noreferrer')
  }

  async function searchForLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = searchQuery.trim()

    if (!query) {
      setSearchResults([])
      setSearchActive(false)
      setSearchError('Enter an address or landmark to search.')
      return
    }

    setSearchStatus('loading')
    setSearchError(null)

    try {
      const params = new URLSearchParams({
        q: `${query}, Metro Manila, Philippines`,
        format: 'jsonv2',
        limit: '5',
      })
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        { headers: { Accept: 'application/json' } },
      )

      if (!response.ok) {
        throw new Error('Search service unavailable')
      }

      const results = (await response.json()) as SearchResult[]
      setSearchResults(results)
      setSearchActive(results.length > 0)
      setSearchStatus('idle')
      if (results.length === 0) {
        setSearchError('No places found. Try a nearby landmark or a more specific address.')
      }
    } catch {
      setSearchStatus('error')
      setSearchError('Search is unavailable right now. Please try again or use your location.')
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div>
            <p className="eyebrow">Metro Manila</p>
            <h1>Carousel Finder</h1>
          </div>
          <nav className="app-nav" aria-label="Main navigation">
            <button className={activeView === 'map' ? 'active' : ''} onClick={() => setActiveView('map')}>Map</button>
            <button className={activeView === 'fare' ? 'active' : ''} onClick={() => setActiveView('fare')}>Fare</button>
            <button className={activeView === 'guide' ? 'active' : ''} onClick={() => setActiveView('guide')}>FAQs</button>
            <button className={activeView === 'help' ? 'active' : ''} onClick={() => setActiveView('help')}>Help</button>
          </nav>
        </div>
      </header>

      {activeView === 'map' && <section className="workspace">
        <div className="map-panel">
          <MapView
            location={activeLocation}
            nearestStation={activeNearest?.station ?? null}
            onWalkingRoute={handleWalkingRoute}
            onStationSelect={handleStationSelect}
            onMapLocationSelect={handleMapLocationSelect}
            transportMode={transportMode}
          />
          <div className="map-legend" aria-label="Map legend">
            <p>Map key</p>
            <div>
              <span className="legend-line legend-line-busway" aria-hidden="true" />
              EDSA Busway
            </div>
            <div>
              <span className="legend-line legend-line-walk" aria-hidden="true" />
              Walking route
            </div>
            <div>
              <span className="legend-stop" aria-hidden="true">1</span>
              Busway stop number
            </div>
          </div>
          <div className="map-note">
            <span className="map-note-mark" aria-hidden="true" />
            Busway corridor only
          </div>
        </div>

        <aside className="route-panel">
          <div className="panel-intro">
            <p className="eyebrow">Your next ride</p>
            <h2>Find the nearest station</h2>
            <p className="intro-copy">
              Use your location or search for a place to find the closest EDSA
              Carousel stop.
            </p>
          </div>

          <button
            className="primary-action"
            type="button"
            onClick={() => {
              setLocationVisible(true)
              requestLocation()
            }}
            disabled={status === 'loading'}
          >
            <span aria-hidden="true">⌖</span>
            {status === 'loading' ? 'Finding your location…' : 'Use my location'}
          </button>

          {activeLocation && (
            <button className="clear-location" type="button" onClick={clearLocation}>
              Remove selected location
            </button>
          )}

          {activeNearest && (
            <div className="nearest-card">
              <p className="eyebrow">Nearest stop</p>
              <strong>{activeNearest.station.name}</strong>
              <span>{Math.round(activeNearest.distance)} m straight-line distance</span>
            </div>
          )}

          {activeNearest && (
            <div className="walking-card">
              <p className="eyebrow">Route options to nearest stop</p>
              <div className="transport-options" role="group" aria-label="Travel mode">
                {([
                  ['walking', 'Walk'],
                  ['motorcycle', 'Motorcycle'],
                  ['bus', 'Bus'],
                  ['jeepney', 'Jeepney'],
                  ['mixed', 'Jeepney + bus'],
                ] as const).map(([mode, label]) => (
                  <button
                    className={transportMode === mode ? 'active' : ''}
                    type="button"
                    key={mode}
                    aria-pressed={transportMode === mode}
                    onClick={() => setTransportMode(mode)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {transportEstimate?.minutes ? (
                <>
                  <strong>
                    About {transportEstimate.minutes} min by {
                      transportMode === 'walking'
                        ? 'walking'
                        : transportMode === 'motorcycle'
                          ? 'motorcycle'
                          : transportMode === 'mixed'
                            ? 'jeepney and bus'
                            : transportMode
                    }
                  </strong>
                  <span>
                    {transportMode === 'walking' && walkingRoute
                      ? `${(walkingRoute.distanceMeters / 1000).toFixed(1)} km walking`
                      : `${transportEstimate.distanceKm.toFixed(1)} km estimate to the stop`}
                  </span>
                  <small className="route-through">
                    Passing through: {transportMode === 'mixed'
                      ? `your location → jeepney connection → bus connection → ${activeNearest.station.name}`
                      : `your location → ${activeNearest.station.name}`}
                  </small>
                  {transportMode === 'mixed' && (
                    <small>Estimated transfer: jeepney to a convenient bus connection, then continue to the stop.</small>
                  )}
                </>
              ) : (
                <span>Walking route is still loading. Choose another mode for a planning estimate.</span>
              )}
            </div>
          )}

          {selectedStation && (
            <div className="station-card">
              <div className="station-card-heading">
                <span className="station-card-number">{selectedStation.order}</span>
                <div>
                  <p className="eyebrow">Busway stop</p>
                  <strong>{selectedStation.name}</strong>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Route position</dt>
                  <dd>
                    Stop {selectedStation.order} of {stations.length}
                  </dd>
                </div>
                <div>
                  <dt>Operating hours</dt>
                  <dd>4:00 AM – 11:00 PM</dd>
                </div>
              </dl>
              <button
                className="navigation-action"
                type="button"
                onClick={openWalkingNavigation}
              >
                <span aria-hidden="true">↗</span>
                {activeLocation ? 'Start walking' : 'Open in maps'}
              </button>
            </div>
          )}

          {(error || searchError || walkingRouteError) && (
            <p className="location-error" role="alert">
              {searchError ?? error ?? walkingRouteError}
            </p>
          )}

          <div className="search-area">
            <form className="search-form" onSubmit={searchForLocation}>
              <label htmlFor="location-search">Search an address or landmark</label>
              <div className="search-input-row">
                <span aria-hidden="true">⌕</span>
                <input
                  id="location-search"
                  value={searchQuery}
                  onFocus={() => setSearchActive(searchResults.length > 0)}
                  onBlur={() => {
                    window.setTimeout(() => setSearchActive(false), 150)
                  }}
                  onChange={(event) => {
                    const nextQuery = event.target.value
                    setSearchQuery(nextQuery)
                    setSearchResults([])
                    setSearchActive(nextQuery.trim().length >= 3)
                    setSearchStatus('idle')
                    setSearchError(null)
                    setSelectedStation(null)
                  }}
                  placeholder="Search an address or landmark"
                />
                <button type="submit" disabled={searchStatus === 'loading'}>
                  {searchStatus === 'loading' ? '…' : 'Search'}
                </button>
              </div>
            </form>

            {searchActive && searchResults.length > 0 && (
              <div
                className="search-results"
                aria-label="Address suggestions"
                role="listbox"
              >
                {searchResults.map((result) => (
                  <button
                    type="button"
                    role="option"
                    key={`${result.lat}-${result.lon}`}
                    onClick={() => {
                      setSelectedLocation({
                        latitude: Number(result.lat),
                        longitude: Number(result.lon),
                      })
                      setSelectedStation(null)
                      setSearchResults([])
                      setSearchQuery(result.display_name.split(',')[0])
                      setSearchError(null)
                    }}
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="route-list">
            <div className="section-heading">
              <h3>Busway stops</h3>
              <span>{stations.length}</span>
            </div>
            <ol aria-label="Busway stops">
              {stations.map((station) => (
                <li key={station.id}>
                  <button
                    className="station-list-button"
                    type="button"
                    onClick={() => setSelectedStation(station)}
                  >
                    <span className="station-number">{station.order}</span>
                    <span>{station.name}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </section>}
      {activeView === 'map' && (
        <section className="map-information" aria-labelledby="map-information-title">
          <div className="map-information-inner">
            <p className="eyebrow">Before you ride</p>
            <h2 id="map-information-title">Plan your busway trip</h2>
            <div className="map-information-grid">
              <article>
                <span className="information-number">01</span>
                <h3>Find your stop</h3>
                <p>
                  Use your location or search for a landmark. The map highlights
                  the nearest stop along the Carousel corridor.
                </p>
              </article>
              <article>
                <span className="information-number">02</span>
                <h3>Check the route</h3>
                <p>
                  Select a numbered stop to review its route position and open a
                  walking direction in your maps app.
                </p>
              </article>
              <article>
                <span className="information-number">03</span>
                <h3>Allow extra time</h3>
                <p>
                  Walking and travel times are estimates. Leave room for
                  boarding, traffic, queues, and station conditions.
                </p>
              </article>
            </div>
            <p className="map-information-note">
              Route and station details are a planning guide. Follow signs,
              operator advisories, and on-site instructions when you travel.
            </p>
          </div>
        </section>
      )}
      {activeView === 'fare' && <FareView />}
      {activeView === 'guide' && <GuideView />}
      {activeView === 'help' && <HelpView />}

      <footer className="app-footer">
        <span>Monumento ↔ PITX</span>
        <span>Estimates only. Follow official advisories.</span>
      </footer>
    </main>
  )
}

export default App
