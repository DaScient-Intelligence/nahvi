const layerRegistry = new Map();
let mapInstance;

export function initMap() {
  mapInstance = L.map('map').setView([41.8781, -87.6298], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapInstance);
  return mapInstance;
}

export function getMap() {
  return mapInstance;
}

export function render_geojson_on_map(geojson, styleOptions = {}, layerName = 'dynamic') {
  removeLayer(layerName);
  const layer = L.geoJSON(geojson, {
    style: styleOptions,
    pointToLayer: (_, latlng) => L.circleMarker(latlng, { radius: 6, ...styleOptions })
  }).addTo(mapInstance);
  layerRegistry.set(layerName, layer);
  return layer;
}

export function toggleLayer(layerName, factoryFn) {
  const existing = layerRegistry.get(layerName);
  if (existing) {
    mapInstance.removeLayer(existing);
    layerRegistry.delete(layerName);
    return false;
  }

  const nextLayer = factoryFn();
  layerRegistry.set(layerName, nextLayer);
  return true;
}

export function setLayer(layerName, layer) {
  removeLayer(layerName);
  layerRegistry.set(layerName, layer);
  return layer;
}

export function removeLayer(layerName) {
  const existing = layerRegistry.get(layerName);
  if (existing) {
    mapInstance.removeLayer(existing);
    layerRegistry.delete(layerName);
  }
}

export function centerMapOn(lat, lng, zoom = 14) {
  mapInstance.setView([lat, lng], zoom);
}
