/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE — Geo Utilities

   Fonctions utilitaires pour le calcul de distances GPS
   et la détection de zones géographiques (GeoFencing).

   Formule de Haversine pour la distance entre deux points GPS.
   ═══════════════════════════════════════════════════════ */

/**
 * Rayon de la Terre en mètres.
 */
const EARTH_RADIUS_M = 6_371_000;

/**
 * Convertit des degrés en radians.
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calcule la distance entre deux coordonnées GPS
 * en utilisant la formule de Haversine.
 *
 * @returns Distance en mètres
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * Vérifie si un point GPS se trouve à l'intérieur d'un cercle
 * défini par son centre et son rayon.
 *
 * @param lat Latitude du point
 * @param lng Longitude du point
 * @param centerLat Latitude du centre de la zone
 * @param centerLng Longitude du centre de la zone
 * @param radiusMeters Rayon en mètres
 * @returns true si le point est dans la zone
 */
export function isInsideGeoFence(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
): boolean {
  const distance = haversineDistance(lat, lng, centerLat, centerLng);
  return distance <= radiusMeters;
}

/**
 * Calcule la distance d'un point par rapport au bord d'une zone circulaire.
 * Valeur négative = à l'intérieur, positive = à l'extérieur.
 *
 * @returns Distance en mètres par rapport au bord de la zone
 */
export function distanceFromGeoFenceEdge(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
): number {
  const distance = haversineDistance(lat, lng, centerLat, centerLng);
  return distance - radiusMeters;
}

/**
 * Calcule le bearing (cap) entre deux points GPS.
 *
 * @returns Bearing en degrés (0-360)
 */
export function bearingBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLng = toRad(lng2 - lng1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return ((bearing % 360) + 360) % 360;
}

/**
 * Calcule le temps de trajet estimé entre deux points GPS
 * à une vitesse moyenne donnée.
 *
 * @param distanceMeters Distance en mètres
 * @param speedKmh Vitesse moyenne en km/h (défaut: 30 km/h en ville)
 * @returns Temps estimé en minutes
 */
export function estimatedTravelTime(
  distanceMeters: number,
  speedKmh: number = 30,
): number {
  const distanceKm = distanceMeters / 1000;
  return Math.round((distanceKm / speedKmh) * 60);
}

/**
 * Formate une distance en mètres pour l'affichage.
 * Ex: "150 m", "1.2 km", "12 km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

/**
 * Valide que des coordonnées GPS sont dans des plages raisonnables.
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}
