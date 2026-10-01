import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { stations } from './data/stations'
import './App.css'

const metroManilaCenter: L.LatLngExpression = [14.58, 121.03]

function MapView() {
  const mapElement = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapElement.current) {
      return
    }

    const map = L.map(mapElement.current, {
      center: metroManilaCenter,
      zoom: 11,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    return () => {
      map.remove()
    }
  }, [])

  return <div className="map-view" ref={mapElement} aria-label="Metro Manila map" />
}

function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Metro Manila</p>
          <h1>Carousel Finder</h1>
        </div>
        <span className="status-badge">EDSA Busway</span>
      </header>

      <section className="workspace">
        <div className="map-panel">
          <MapView />
          <div className="map-note">
            <span className="map-note-mark" aria-hidden="true" />
            Route data is being verified
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

          <button className="primary-action" type="button">
            <span aria-hidden="true">⌖</span>
            Use my location
          </button>

          <div className="search-placeholder">
            <span aria-hidden="true">⌕</span>
            <span>Search an address or landmark</span>
          </div>

          <div className="route-list">
            <div className="section-heading">
              <h3>Busway stops</h3>
              <span>{stations.length}</span>
            </div>
            <ol>
              {stations.map((station) => (
                <li key={station.id}>
                  <span className="station-number">{station.order}</span>
                  <span>{station.name}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </section>

      <footer className="app-footer">
        <span>Monumento ↔ PITX</span>
        <span>Estimates only. Follow official advisories.</span>
      </footer>
    </main>
  )
}

export default App
