import { getMap, setLayer, removeLayer } from './map.js';

const PM25_MODERATE_THRESHOLD = 12;
const PM25_UNHEALTHY_THRESHOLD = 35;

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
  const response = await fetch(`https://api.openaq.org/v2/latest?city=${encodeURIComponent(city)}&limit=100`);
  if (!response.ok) {
    throw new Error(`OpenAQ request failed (${response.status})`);
  }

  const data = await response.json();
  const markers = (data.results || [])
    .filter((result) => result.coordinates && result.measurements?.length)
    .map((result) => {
      const pm = result.measurements.find((m) => m.parameter === 'pm25') || result.measurements[0];
      const color = pm.value > PM25_UNHEALTHY_THRESHOLD ? '#dc2626' : pm.value > PM25_MODERATE_THRESHOLD ? '#f59e0b' : '#16a34a';
      return L.circleMarker([result.coordinates.latitude, result.coordinates.longitude], {
        radius: 5,
        color,
        fillOpacity: 0.8
      }).bindPopup(`${result.location}<br>${pm.parameter.toUpperCase()}: ${pm.value} ${pm.unit}`);
    });

  const layer = L.layerGroup(markers).addTo(getMap());
  setLayer('airQuality', layer);
}
