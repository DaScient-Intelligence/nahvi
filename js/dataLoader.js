const DATASETS = {
  amenities: './data/amenities.geojson',
  hazards: './data/hazard_zones.geojson',
  crime: './data/sample_crime.geojson'
};

const cache = new Map();

export async function loadGeoJSON(name) {
  if (cache.has(name)) {
    return cache.get(name);
  }

  const source = DATASETS[name];
  if (!source) {
    throw new Error(`Unknown dataset: ${name}`);
  }

  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`Failed to load ${source}`);
  }

  const data = await response.json();
  cache.set(name, data);
  return data;
}

export async function query_overlay_data(bounding_box, layer_type) {
  const data = await loadGeoJSON(layer_type);
  if (!Array.isArray(bounding_box) || bounding_box.length !== 4) {
    return data;
  }

  const bboxPoly = turf.bboxPolygon(bounding_box);
  return {
    ...data,
    features: data.features.filter((feature) => turf.booleanIntersects(feature, bboxPoly))
  };
}

export function getDataSourceLink(layerType) {
  const links = {
    amenities: 'https://www.openstreetmap.org/',
    hazards: 'https://www.fema.gov/flood-maps',
    crime: 'https://data.cityofchicago.org/'
  };
  return links[layerType] || '';
}
