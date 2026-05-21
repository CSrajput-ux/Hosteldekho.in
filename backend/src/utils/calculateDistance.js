// ─────────────────────────────────────────────────────────────
// Utils — Haversine Distance Calculator
// ─────────────────────────────────────────────────────────────

/**
 * Calculate the distance (in km) between two coordinates
 * using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of point A
 * @param {number} lng1 - Longitude of point A
 * @param {number} lat2 - Latitude of point B
 * @param {number} lng2 - Longitude of point B
 * @returns {number}    - Distance in kilometres (2 decimal places)
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const EARTH_RADIUS_KM = 6371;

  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
};

module.exports = { calculateDistance };
