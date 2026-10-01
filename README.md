# Carousel Finder

A free web app that guides commuters to the nearest **Bus Carousel station**, with a suggested route and ETA. No account, no sign-up. Just open it and go.

## Why this exists

The Bus Carousel is a favorite among commuters because it runs on its own dedicated lane, so it skips the traffic. The problem is that stations are limited, and it's not always obvious where the nearest one is or how to get there. Carousel Finder fixes that.

## What it does

- Finds the nearest Bus Carousel station from where you are
- Uses your **GPS location**, or you can **type your location** instead
- Shows the **route** from you to the station (walking by default, with other options if possible)
- Shows an **ETA** that takes things like traffic and flooding into account
- **Highlights the Bus Carousel lane** and all stations on the map
- Works on **Android, iOS, and desktop browsers**
- Free to use, no login needed

## Main user flow

1. User opens the site
2. User taps "Use my location" or types an address / landmark
3. App finds the nearest carousel station
4. App draws the route to the station and shows the ETA
5. Carousel lane and stations stay highlighted on the map the whole time

## Features

### Core (MVP)
- [ ] Interactive map with the Bus Carousel lane highlighted
- [ ] All carousel stations marked on the map
- [ ] "Use my location" button (browser Geolocation API)
- [ ] Manual location search with autocomplete
- [ ] Nearest station detection
- [ ] Route from user to station, with turn-by-turn directions
- [ ] ETA display
- [ ] Mobile-first responsive layout

### Next
- [ ] Traffic-aware ETA
- [ ] Flood and road-closure warnings that affect the route or ETA
- [ ] Weather info (rain alerts)
- [ ] Route options: walking, jeepney/tricycle, driving
- [ ] Installable as a PWA (add to home screen, works like an app)
- [ ] Dark mode
- [ ] Filipino / English language toggle

### Maybe later
- [ ] Station info (name, nearby landmarks, operating hours)
- [ ] Share route link
- [ ] Offline support for the map and station list
- [ ] Route from a station to a destination (full trip planner)

## Tech stack (suggested)

Everything below has a free tier, so the app can stay free to run.

| Part | Suggestion |
|------|-----------|
| Framework | React + Vite (or Next.js) |
| Styling | Tailwind CSS |
| Map | Leaflet + OpenStreetMap tiles (or MapLibre GL) |
| Routing | OpenRouteService or OSRM |
| Geocoding / search | Nominatim or Photon (OpenStreetMap-based) |
| Weather | Open-Meteo |
| Traffic / flood data | See "Data sources" below |
| Hosting | Vercel or Netlify |
| Mobile support | PWA (one codebase for Android, iOS, and web) |

## Data sources

- **Carousel lane and stations:** stored as a local GeoJSON file in `/src/data/`. Station coordinates need to be collected and verified manually, since there is no official free API for this.
- **Traffic:** real-time traffic is usually paid (Google, TomTom, HERE). Start with a simple ETA based on distance and time of day, then add a traffic API with a free tier once the MVP works.
- **Flood:** there's no single clean source. Options are weather/rainfall data from Open-Meteo, official advisories, or a simple manual "flood alert" list that can be updated by hand. Treat flood info as a warning, not a guarantee.

## Suggested project structure

```
carousel-finder/
├── public/
│   └── icons/              # PWA icons
├── src/
│   ├── components/
│   │   ├── Map.jsx
│   │   ├── SearchBar.jsx
│   │   ├── RoutePanel.jsx
│   │   └── EtaCard.jsx
│   ├── data/
│   │   ├── carousel-lane.geojson
│   │   └── stations.json
│   ├── hooks/
│   │   └── useGeolocation.js
│   ├── utils/
│   │   ├── nearestStation.js
│   │   └── eta.js
│   ├── App.jsx
│   └── main.jsx
├── README.md
└── package.json
```

## Getting started

```bash
# clone the repo
git clone https://github.com/<your-username>/carousel-finder.git
cd carousel-finder

# install dependencies
npm install

# add your API keys (if any)
cp .env.example .env

# run locally
npm run dev
```

## Environment variables

```
VITE_ORS_API_KEY=your_openrouteservice_key
```

Add others here as needed. Never commit your real `.env` file.

## Design notes

- **Mobile first.** Most commuters will use this on their phone, often outdoors, so buttons should be big and text readable in sunlight.
- **Fast.** Should load quickly on slow mobile data.
- **Simple.** One screen, one job: get me to the nearest station.
- **Carousel lane is the star.** Use a bold, distinct color for the lane and station markers so it stands out from regular roads.
- **Privacy.** Location is only used in the browser to find the nearest station. Nothing is stored or sent to a server of our own, and there are no accounts.

## Notes for GitHub Copilot

If you're an AI assistant helping build this, keep these in mind:

- Keep the code simple and readable. Avoid over-engineering.
- No login, no database, no user accounts.
- Always handle the case where the user denies location permission (fall back to manual search).
- Handle loading, error, and "no route found" states.
- Use free APIs only.
- Make every screen work on a small phone first, then scale up.
- Build the MVP checklist first before touching "Next" or "Maybe later" items.

## Roadmap

1. **Phase 1:** Map, lane, stations, GPS and manual location, nearest station
2. **Phase 2:** Routing and basic ETA
3. **Phase 3:** Traffic, flood, and weather adjustments
4. **Phase 4:** PWA, polish, deploy

## Disclaimer

ETA and route information are estimates. Traffic, flooding, and road conditions can change quickly. Always follow official advisories and use your own judgment.

## Contributing

Suggestions and bug reports are welcome. Open an issue or submit a pull request.

## License

MIT
