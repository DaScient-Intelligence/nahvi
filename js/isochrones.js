import { getMap, removeLayer, setLayer } from './map.js';
import { getORSKey } from './keys.js';

export async function calculate_isochrone(location, time, profile) {
  const key = getORSKey();
  const response = await fetch(`https://api.openrouteservice.org/v2/isochrones/${profile}`, {
    method: 'POST',
    headers: {
      Authorization: key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      locations: [location],
      range: [time * 60],
      range_type: 'time'
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Isochrone request failed (${response.status}): ${details}`);
  }

  return response.json();
}

export function drawIsochrone(geojson) {
  removeLayer('isochrone');
  const layer = L.geoJSON(geojson, {
    style: { color: '#16a34a', weight: 2, fillOpacity: 0.15 }
  }).addTo(getMap());
  setLayer('isochrone', layer);
  getMap().fitBounds(layer.getBounds(), { padding: [20, 20] });
}

export function countAmenitiesInIsochrone(isochroneGeoJSON, amenitiesGeoJSON) {
  const polygon = isochroneGeoJSON.features?.[0];
  if (!polygon) return { reachable: 0, total: amenitiesGeoJSON.features.length, byType: {} };

  const byType = {};
  let reachable = 0;

  for (const feature of amenitiesGeoJSON.features) {
    const inside = turf.booleanPointInPolygon(feature, polygon);
    if (!inside) continue;
    reachable += 1;
    const kind = feature.properties.category || 'other';
    byType[kind] = (byType[kind] || 0) + 1;
  }

  return { reachable, total: amenitiesGeoJSON.features.length, byType };
}
