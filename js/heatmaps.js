import { getMap, setLayer, removeLayer } from './map.js';

const PM25_MODERATE_THRESHOLD = 12;
const PM25_UNHEALTHY_THRESHOLD = 35;

function getAirQualityColor(pmValue) {
  if (pmValue > PM25_UNHEALTHY_THRESHOLD) return '#dc2626';
  if (pmValue > PM25_MODERATE_THRESHOLD) return '#f59e0b';
  return '#16a34a';
}

export function showSafetyHeatmap(crimeGeoJSON) {
  removeLayer('crimeHeatmap');
  const points = crimeGeoJSON.features
    .filter((f) => f.geometry?.type === 'Point')
    .map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      const weight = Number(f.properties.weight || 1);
      return [lat, lng, Math.min(weight, 5)];
    });

  const layer = L.heatLayer(points, { radius: 25, blur: 18, maxZoom: 17 }).addTo(getMap());
  setLayer('crimeHeatmap', layer);
}

export async function showAirQuality(city = 'chicago') {
  removeLayer('airQuality');
  // OpenAQ v3: parameter_id=2 is pm25; each result is a single measurement record.
  const response = await fetch(
    `https://api.openaq.org/v3/measurements?parameter_id=2&city=${encodeURIComponent(city)}&limit=100`
  );
  if (!response.ok) {
    throw new Error(`OpenAQ request failed (${response.status})`);
  }

  const data = await response.json();
  const markers = (data.results || [])
    .filter((result) => result.location?.coordinates && result.value != null)
    .map((result) => {
      const { latitude, longitude } = result.location.coordinates;
      const color = getAirQualityColor(result.value);
      return L.circleMarker([latitude, longitude], {
        radius: 5,
        color,
        fillOpacity: 0.8
      }).bindPopup(
        `${result.location.name}<br>${result.parameter.name.toUpperCase()}: ${result.value} ${result.parameter.units}`
      );
    });

  const layer = L.layerGroup(markers).addTo(getMap());
  setLayer('airQuality', layer);
}
