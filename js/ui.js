import { centerMapOn, initMap, render_geojson_on_map, toggleLayer } from './map.js';
import { getDataSourceLink, loadGeoJSON, query_overlay_data } from './dataLoader.js';
import { drawRoute, find_safe_route, optimizeStops } from './routes.js';
import { calculate_isochrone, countAmenitiesInIsochrone, drawIsochrone } from './isochrones.js';
import { showSafetyHeatmap, showAirQuality } from './heatmaps.js';

const state = {
  amenities: null,
  hazards: null,
  crime: null
};
const ASSISTANT_FILTER_BBOX = [-87.75, 41.82, -87.58, 41.93];

function setDataSource(layerType) {
  const el = document.querySelector('#data-source');
  const href = getDataSourceLink(layerType);
  el.innerHTML = href ? `Data source: <a href="${href}" target="_blank" rel="noreferrer">public dataset link</a>` : '';
}

function parseLngLat(value) {
  const [lat, lng] = value.split(',').map((v) => Number(v.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Coordinates must be in lat,lng format.');
  }
  return [lng, lat];
}

function saveKeys(event) {
  event.preventDefault();
  const ors = document.querySelector('#ors-key').value.trim();
  const openai = document.querySelector('#openai-key').value.trim();
  const anthropic = document.querySelector('#anthropic-key').value.trim();

  if (ors) localStorage.setItem('nahvi_ors_key', ors);
  if (openai) localStorage.setItem('nahvi_openai_key', openai);
  if (anthropic) localStorage.setItem('nahvi_anthropic_key', anthropic);

  alert('Keys saved in your browser localStorage.');
}

async function handleRoute(event) {
  event.preventDefault();
  try {
    const start = parseLngLat(document.querySelector('#route-start').value);
    const end = parseLngLat(document.querySelector('#route-end').value);
    const profile = document.querySelector('#route-profile').value;
    const avoidHazards = document.querySelector('#avoid-hazards').checked;

    const avoidGeoJSON = avoidHazards ? state.hazards : undefined;
    const routeGeoJSON = await find_safe_route(start, end, profile, { avoidGeoJSON });
    drawRoute(routeGeoJSON);
  } catch (error) {
    alert(error.message);
  }
}

async function handleIsochrone(event) {
  event.preventDefault();
  try {
    const center = parseLngLat(document.querySelector('#iso-center').value);
    const minutes = Number(document.querySelector('#iso-minutes').value);
    const profile = document.querySelector('#iso-profile').value;
    const isochrone = await calculate_isochrone(center, minutes, profile);
    drawIsochrone(isochrone);

    const summary = countAmenitiesInIsochrone(isochrone, state.amenities);
    document.querySelector('#amenity-summary').textContent =
      `Reachable amenities: ${summary.reachable}/${summary.total} (${Object.entries(summary.byType)
        .map(([kind, count]) => `${kind}: ${count}`)
        .join(', ') || 'none'})`;
  } catch (error) {
    alert(error.message);
  }
}

async function runAssistantAction(event) {
  event.preventDefault();
  const prompt = document.querySelector('#assistant-prompt').value.toLowerCase();

  if (prompt.includes('hazard') || prompt.includes('flood')) {
    render_geojson_on_map(state.hazards, { color: '#ef4444', weight: 1, fillOpacity: 0.2 }, 'hazards');
    alert('Assistant action: displayed hazard overlay.');
    return;
  }

  if (prompt.includes('safety') || prompt.includes('crime')) {
    showSafetyHeatmap(state.crime);
    alert('Assistant action: displayed safety heatmap.');
    return;
  }

  if (prompt.includes('amenity') || prompt.includes('15 minute')) {
    const filtered = await query_overlay_data(ASSISTANT_FILTER_BBOX, 'amenities');
    render_geojson_on_map(filtered, { color: '#0ea5e9' }, 'amenities');
    alert('Assistant action: displayed amenity overlay for active area.');
    return;
  }

  alert('Prompt not recognized. Try phrases like "show hazards", "show safety heatmap", or "show amenities".');
}

function locateUser() {
  if (!navigator.geolocation) {
    alert('Geolocation is not available in this browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      centerMapOn(position.coords.latitude, position.coords.longitude);
    },
    (error) => {
      alert(`Unable to get location: ${error.message}`);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

async function runOptimizationDemo() {
  try {
    const start = parseLngLat(document.querySelector('#route-start').value);
    const stops = [
      [-87.6211, 41.8799],
      [-87.6402, 41.8825],
      [-87.6196, 41.8763]
    ];
    const result = await optimizeStops(start, stops);
    const jobs = result.routes?.[0]?.steps?.filter((step) => step.type === 'job') || [];
    const sequence = jobs.map((step) => step.id).join(' → ') || 'No optimized sequence returned';
    alert(`Volunteer route optimization: ${sequence}`);
  } catch (error) {
    alert(error.message);
  }
}

async function bootstrap() {
  initMap();

  [state.amenities, state.hazards, state.crime] = await Promise.all([
    loadGeoJSON('amenities'),
    loadGeoJSON('hazards'),
    loadGeoJSON('crime')
  ]);

  document.querySelector('#keys-form').addEventListener('submit', saveKeys);
  document.querySelector('#route-form').addEventListener('submit', handleRoute);
  document.querySelector('#iso-form').addEventListener('submit', handleIsochrone);
  document.querySelector('#assistant-form').addEventListener('submit', runAssistantAction);
  document.querySelector('#locate-me').addEventListener('click', locateUser);

  document.querySelector('#toggle-amenities').addEventListener('click', () => {
    toggleLayer('amenities', () => render_geojson_on_map(state.amenities, { color: '#0ea5e9' }, 'amenities'));
    setDataSource('amenities');
  });

  document.querySelector('#toggle-hazards').addEventListener('click', () => {
    toggleLayer('hazards', () => render_geojson_on_map(state.hazards, { color: '#ef4444', weight: 1, fillOpacity: 0.2 }, 'hazards'));
    setDataSource('hazards');
  });

  document.querySelector('#toggle-crime').addEventListener('click', () => {
    showSafetyHeatmap(state.crime);
    setDataSource('crime');
  });
  document.querySelector('#load-air').addEventListener('click', async () => {
    try {
      await showAirQuality();
      setDataSource('');
    } catch (error) {
      alert(error.message);
    }
  });

  document.querySelector('#optimize-demo').addEventListener('click', runOptimizationDemo);
}

bootstrap().catch((error) => {
  const summary = document.querySelector('#amenity-summary');
  if (summary) {
    summary.textContent = `Startup error: ${error.message}`;
  }
  console.error('Failed to start Nahvi', error);
});
