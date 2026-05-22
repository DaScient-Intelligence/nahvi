const ORS_KEY_STORAGE_NAME = 'nahvi_ors_key';

export function getORSKey() {
  const key = localStorage.getItem(ORS_KEY_STORAGE_NAME);
  if (!key) {
    throw new Error('Missing ORS key. Save your key first.');
  }
  return key;
}
