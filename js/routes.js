import { getMap, removeLayer, setLayer } from './map.js';

function getRequiredKey() {
  const key = localStorage.getItem('nahvi_ors_key');
  if (!key) {
    throw new Error('Missing ORS key. Save your key first.');
  }
  return key;
}

export async function find_safe_route(start, end, profile, options = {}) {
  const key = getRequiredKey();
  const body = {
    coordinates: [start, end],
    instructions: true
  };

  if (options.avoidGeoJSON) {
    body.options = { avoid_polygons: options.avoidGeoJSON };
  }

  const response = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
    method: 'POST',
    headers: {
      Authorization: key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Route request failed (${response.status}): ${details}`);
  }

  return response.json();
}

export function drawRoute(routeGeoJSON) {
  removeLayer('route');
  const layer = L.geoJSON(routeGeoJSON, {
    style: { color: '#0284c7', weight: 5 }
  }).addTo(getMap());
  setLayer('route', layer);
  getMap().fitBounds(layer.getBounds(), { padding: [20, 20] });
}

export async function optimizeStops(start, stops) {
  const key = getRequiredKey();
  const jobs = stops.map((coord, index) => ({ id: index + 1, location: coord }));
  const vehicles = [{ id: 1, profile: 'driving-car', start, end: start }];
  const response = await fetch('https://api.openrouteservice.org/optimization', {
    method: 'POST',
    headers: {
      Authorization: key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ jobs, vehicles })
  });

  if (!response.ok) {
    throw new Error(`Optimization failed: ${response.status}`);
  }

  return response.json();
}
