# Nahvi

Nahvi is a static, privacy-preserving **agentic mapping assistant** for accessibility, environmental health, disaster resilience, and equitable urban planning.

- **Hosting target:** GitHub Pages
- **Rendering:** Leaflet (+ Leaflet.heat)
- **Spatial operations:** Turf.js
- **Routing / isochrones / optimization:** OpenRouteService (ORS)
- **Data model:** Local static GeoJSON overlays + optional live OpenAQ fetch

## Mission

Nahvi helps answer questions such as:

- What is the safest and most accessible route to a destination?
- Which corridors have lower pollution or heat stress?
- Which neighborhoods are cut off by hazard zones?
- What amenities are reachable within 15 minutes?

## Project structure

```text
nahvi/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── map.js
│   ├── routes.js
│   ├── isochrones.js
│   ├── heatmaps.js
│   ├── dataLoader.js
│   └── ui.js
├── data/
│   ├── amenities.geojson
│   ├── hazard_zones.geojson
│   └── sample_crime.geojson
└── .github/workflows/
    └── update_data.yml
```

## Agentic tool interface implemented

The app includes frontend “tool” functions that the client-side assistant can call:

- `calculate_isochrone(location, time, profile)` in `/js/isochrones.js`
- `find_safe_route(start, end, profile)` in `/js/routes.js`
- `query_overlay_data(bounding_box, layer_type)` in `/js/dataLoader.js`
- `render_geojson_on_map(geojson, style_options)` in `/js/map.js`

## BYO-key security model

Nahvi stores user-provided API keys in browser `localStorage` only:

- `nahvi_ors_key`
- `nahvi_openai_key` (optional)
- `nahvi_anthropic_key` (optional)

No backend persistence or tracking is implemented.

## Features included now

- Wheelchair-capable ORS routing profile toggle
- Hazard-zone route avoidance option using ORS `avoid_polygons`
- 5–60 minute ORS isochrones with amenity counting (15-minute city baseline)
- Safety heatmap from static crime sample
- Air quality overlay from OpenAQ API
- Data-source link display for each local overlay
- “Use my location” geolocation shortcut
- Volunteer stop optimization demo (ORS optimization API)
- Lightweight prompt box that maps intent keywords to tool actions

## Running locally

Because the app uses ES modules and fetches local GeoJSON files, serve it over HTTP:

```bash
cd /home/runner/work/nahvi/nahvi
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Data transparency and ethics

- Overlay sources are public/open (OSM, FEMA-style hazard examples, city open data style samples).
- Nahvi is a planning tool and **not** a replacement for official emergency alerts.
- ORS wheelchair routing is useful but should be verified against ground truth.
- ORS free-tier limits apply; user-facing errors are surfaced when requests fail.
