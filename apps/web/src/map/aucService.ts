// Client minimaliste pour le service ArcGIS REST de l'Agence Urbaine de Casablanca
// (https://e-auc.org/karazal). Pas de SDK ESRI : appel direct + conversion ESRI → GeoJSON.
//
// Calque de zonage karazal : Layer-579747 (attributs zone, secteur, commune,
// prefecture, area). Le client passe par notre relais /api/auc (fonction
// Vercel, et middleware Vite en dev) : le service AUC ne renvoie pas toujours
// les en-têtes CORS attendus.
import { familleOf } from "../zoning/zones";

const ZONAGE_LAYER = "Layer-579747";
const API_ROOT = "/api/auc";
// Ne pas modifier sans raison : l'URL exacte sert de clé au cache CDN.
const ZONAGE_FIELDS = ["id", "zone", "secteur", "commune", "prefecture", "area", "label", "name", "origine"];

export interface BBox4326 {
  W: number;
  E: number;
  S: number;
  N: number;
}

interface EsriFeature {
  attributes: Record<string, unknown> & { id?: number; secteur?: unknown };
  geometry?: { rings?: number[][][] };
}

interface EsriResponse {
  features?: EsriFeature[];
}

/**
 * Requête ArcGIS « query » sur une emprise :
 *  - inSR/outSR = 4326 → WGS 84 dans les deux sens
 *  - geometryType = esriGeometryEnvelope → bbox simple
 *  - returnExceededLimitFeatures = true → accepte plus que la limite par défaut
 */
function buildUrl(bbox: BBox4326): string {
  const geom = JSON.stringify({
    xmin: bbox.W,
    ymin: bbox.S,
    xmax: bbox.E,
    ymax: bbox.N,
    spatialReference: { wkid: 4326 },
  });
  const params = new URLSearchParams({
    layer: ZONAGE_LAYER,
    f: "json",
    where: "1=1",
    outFields: ZONAGE_FIELDS.join(","),
    geometry: geom,
    geometryType: "esriGeometryEnvelope",
    spatialRel: "esriSpatialRelIntersects",
    inSR: "4326",
    outSR: "4326",
    returnGeometry: "true",
    returnExceededLimitFeatures: "true",
  });
  return `${API_ROOT}?${params.toString()}`;
}

// Reprojection EPSG:3857 → EPSG:4326 (Mercator sphérique inverse).
// Détection par magnitude des coordonnées : si |x| > 1000, on est en mètres
// (Web Mercator), sinon on est déjà en degrés. Le serveur karazal déclare
// systématiquement spatialReference.wkid=102100 même quand il renvoie en
// 4326 → on ne peut pas se fier à cette annonce.
const R_EARTH = 6378137;
const RAD_TO_DEG = 180 / Math.PI;

function mercToWgs84([x, y]: [number, number]): [number, number] {
  const lng = (x / R_EARTH) * RAD_TO_DEG;
  const lat = (2 * Math.atan(Math.exp(y / R_EARTH)) - Math.PI / 2) * RAD_TO_DEG;
  return [lng, lat];
}

const looksMercator = (rings: number[][][]) => Math.abs(rings[0]?.[0]?.[0] ?? 0) > 1000;

/** Aire signée (formule du lacet) : < 0 = sens horaire. */
function signedArea(ring: [number, number][]): number {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i]![0] * ring[i + 1]![1] - ring[i + 1]![0] * ring[i]![1];
  }
  return a / 2;
}

function pointInRing([x, y]: [number, number], ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Anneaux ESRI → GeoJSON. Convention ESRI : anneaux extérieurs dans le sens
 * horaire, trous dans le sens anti-horaire. Chaque trou est rattaché à
 * l'anneau extérieur qui le contient (sinon les trous apparaissent remplis
 * par-dessus les zones enclavées, et un clic dans l'enclave sélectionne la
 * mauvaise zone).
 */
function ringsToPolygon(rings: number[][][]): GeoJSON.Polygon | GeoJSON.MultiPolygon {
  const reproject = looksMercator(rings);
  const projected = rings.map((ring) =>
    ring.map((p) => (reproject ? mercToWgs84([p[0]!, p[1]!]) : ([p[0]!, p[1]!] as [number, number]))),
  );
  if (projected.length === 1) return { type: "Polygon", coordinates: [projected[0]!] };

  const outers: [number, number][][][] = [];
  const holes: [number, number][][] = [];
  for (const r of projected) (signedArea(r) <= 0 ? outers.push([r]) : holes.push(r));
  // Aucun anneau horaire (orientation inattendue) : un polygone par anneau.
  if (outers.length === 0) return { type: "MultiPolygon", coordinates: projected.map((r) => [r]) };
  for (const h of holes) {
    const owner = outers.find((poly) => pointInRing(h[0]!, poly[0]!)) ?? outers[outers.length - 1]!;
    owner.push(h);
  }
  return outers.length === 1
    ? { type: "Polygon", coordinates: outers[0]! }
    : { type: "MultiPolygon", coordinates: outers };
}

function esriToGeojson(data: EsriResponse): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const f of data.features ?? []) {
    const rings = f.geometry?.rings;
    if (!rings || rings.length === 0) continue;
    const secteur = typeof f.attributes.secteur === "string" ? f.attributes.secteur.trim() : "";
    features.push({
      type: "Feature",
      properties: {
        ...f.attributes,
        aucId: typeof f.attributes.id === "number" ? f.attributes.id : 0,
        // Famille précalculée : l'expression de couleur MapLibre reste un simple match.
        famille: secteur ? familleOf(secteur) : "?",
      },
      geometry: ringsToPolygon(rings),
    });
  }
  return { type: "FeatureCollection", features };
}

// Petit cache mémoire (LRU, 50 emprises) : réaffichage immédiat quand on
// désactive puis réactive le calque. Le cache durable est assuré par le CDN
// Vercel et le service worker.
const CACHE = new Map<string, GeoJSON.FeatureCollection>();
const CACHE_MAX = 50;

export async function fetchZonage(
  bbox: BBox4326,
  signal?: AbortSignal,
): Promise<GeoJSON.FeatureCollection> {
  const url = buildUrl(bbox);
  const cached = CACHE.get(url);
  if (cached) {
    CACHE.delete(url);
    CACHE.set(url, cached);
    return cached;
  }
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`AUC HTTP ${res.status}`);
  const data = (await res.json()) as EsriResponse & { error?: unknown };
  // Erreur ArcGIS déguisée en succès : on échoue (le carré sera retenté)
  // plutôt que d'afficher et de garder en cache une zone vide.
  if (!Array.isArray(data.features)) throw new Error("AUC : réponse sans zonage");
  const fc = esriToGeojson(data);
  CACHE.set(url, fc);
  if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value!);
  return fc;
}
