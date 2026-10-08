// Client minimaliste pour le service ArcGIS REST de l'Agence Urbaine de Casablanca
// (https://e-auc.org/karazal). Pas de SDK ESRI : appel direct + conversion ESRI → GeoJSON.
//
// Découvert via l'inspection du géoportail public e-auc.org/karazal :
//   GET /karazal/kgis/rest/featuresService/features/{layer}/all/1/query
//   Headers : CORS ouvert (Access-Control-Allow-Origin: *)
//   Sortie : { features: [{attributes, geometry: {rings}}], spatialReference: {wkid: 102100} }
//
// IDs des calques karazal — confirmés par inspection du géoportail
// e-auc.org/karazal :
//   Layer-579747 → ZONAGE (attributs zone, secteur, commune, prefecture, area)
//   Layer-579748 → ÉQUIPEMENTS & espaces publics (attribut nature)
//
// Possibilité d'override via localStorage.auc-zonage-layer-id pour explorer
// d'autres calques sans redéployer.
const STORAGE_KEY = "auc-zonage-layer-id";

function readLayerOverride(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setZonageLayerId(id: string): void {
  if (typeof localStorage === "undefined") return;
  if (id) localStorage.setItem(STORAGE_KEY, id);
  else localStorage.removeItem(STORAGE_KEY);
}

const DEFAULT_LAYERS = {
  zonage: "Layer-579747",
  equipements: "Layer-579748",
} as const;

/**
 * Renvoie l'ID actuel du calque (override localStorage en priorité).
 * Évalué dynamiquement à chaque appel — donc setZonageLayerId est pris
 * en compte sans recharger la page.
 */
export function currentZonageLayer(): string {
  return readLayerOverride() ?? DEFAULT_LAYERS.zonage;
}

export const AUC_LAYERS = {
  get zonage() {
    return currentZonageLayer();
  },
  equipements: DEFAULT_LAYERS.equipements,
};

export type AucLayer = keyof typeof DEFAULT_LAYERS;

// Le client appelle notre proxy Vercel (apps/web/api/auc.js), qui relaie
// au service AUC. Cela contourne les restrictions CORS observées en prod
// quand on essaie d'attaquer e-auc.org directement depuis le navigateur.
const API_ROOT = "/api/auc";

export interface BBox4326 {
  W: number;
  E: number;
  S: number;
  N: number;
}

export interface AucFeature<A> {
  type: "Feature";
  properties: A & { aucId: number; aucLayer: AucLayer };
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

export interface ZoneAttributes {
  zone?: string;
  secteur?: string;
  commune?: string;
  prefecture?: string;
  area?: number;
  label?: string;
  name?: string;
  origine?: string;
}

export interface EquipementAttributes {
  nature?: string;
  area?: number;
  label?: string;
}

interface EsriFeature {
  attributes: Record<string, unknown> & { id?: number };
  geometry?: { rings?: number[][][] };
}

interface EsriResponse {
  features?: EsriFeature[];
  exceededTransferLimit?: boolean;
  spatialReference?: { wkid?: number; latestWkid?: number };
}

/**
 * Construit l'URL de requête pour un calque ArcGIS karazal.
 *
 * - inSR/outSR = 4326 → on parle WGS 84 dans toutes les directions
 * - geometryType = esriGeometryEnvelope → bbox simple
 * - returnExceededLimitFeatures = true → indique au serveur qu'on accepte
 *   éventuellement plus de features que la limite par défaut
 */
function buildUrl(layer: string, bbox: BBox4326, fields: string[]): string {
  const geom = JSON.stringify({
    xmin: bbox.W,
    ymin: bbox.S,
    xmax: bbox.E,
    ymax: bbox.N,
    spatialReference: { wkid: 4326 },
  });
  const params = new URLSearchParams({
    layer,
    f: "json",
    where: "1=1",
    outFields: fields.join(","),
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
const MERC_THRESHOLD = 1000;

function mercToWgs84([x, y]: [number, number]): [number, number] {
  const lng = (x / R_EARTH) * RAD_TO_DEG;
  const lat = (2 * Math.atan(Math.exp(y / R_EARTH)) - Math.PI / 2) * RAD_TO_DEG;
  return [lng, lat];
}

function looksMercator(rings: number[][][]): boolean {
  for (const ring of rings) {
    for (const p of ring) {
      const x = p[0];
      if (typeof x === "number" && Math.abs(x) > MERC_THRESHOLD) return true;
      return false; // 1er point examiné suffit
    }
  }
  return false;
}

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
 * l'anneau extérieur qui le contient (avant, chaque anneau devenait un
 * polygone plein : les trous apparaissaient remplis par-dessus les zones
 * enclavées, et un clic dans l'enclave sélectionnait la mauvaise zone).
 */
function ringsToPolygon(
  rings: number[][][],
): GeoJSON.Polygon | GeoJSON.MultiPolygon {
  const reproject = looksMercator(rings);
  const project = reproject
    ? (ring: number[][]) => ring.map((p) => mercToWgs84([p[0]!, p[1]!]))
    : (ring: number[][]) => ring.map((p) => [p[0]!, p[1]!] as [number, number]);
  const projected = rings.map(project);
  if (projected.length === 1) {
    return { type: "Polygon", coordinates: [projected[0]!] };
  }
  const outers: [number, number][][][] = [];
  const holes: [number, number][][] = [];
  for (const r of projected) (signedArea(r) <= 0 ? outers.push([r]) : holes.push(r));
  // Données sans anneau horaire (orientation inattendue) : ancien comportement.
  if (outers.length === 0) {
    return { type: "MultiPolygon", coordinates: projected.map((r) => [r]) };
  }
  for (const h of holes) {
    const owner = outers.find((poly) => pointInRing(h[0]!, poly[0]!)) ?? outers[outers.length - 1]!;
    owner.push(h);
  }
  return outers.length === 1
    ? { type: "Polygon", coordinates: outers[0]! }
    : { type: "MultiPolygon", coordinates: outers };
}

async function fetchLayerEsri(
  layerId: string,
  bbox: BBox4326,
  fields: string[],
  signal?: AbortSignal,
): Promise<EsriResponse> {
  const url = buildUrl(layerId, bbox, fields);
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`AUC ${layerId} HTTP ${res.status}`);
  return res.json();
}

// Cache LRU des réponses AUC zonage. Clé = bbox arrondi à 3 décimales
// (≈ 110 m de précision suffisant pour ré-utiliser une réponse après un
// petit pan). 50 entrées max ; au-delà la plus ancienne est éjectée.
const ZONAGE_CACHE = new Map<string, GeoJSON.FeatureCollection>();
const ZONAGE_CACHE_MAX = 50;

function bboxKey(b: BBox4326): string {
  const r = (n: number) => n.toFixed(3);
  return `${r(b.W)},${r(b.S)},${r(b.E)},${r(b.N)}|${currentZonageLayer()}`;
}

export async function fetchZonage(
  bbox: BBox4326,
  signal?: AbortSignal,
): Promise<GeoJSON.FeatureCollection> {
  const key = bboxKey(bbox);
  const cached = ZONAGE_CACHE.get(key);
  if (cached) {
    // Touch (LRU) : ré-insère pour mettre en tête.
    ZONAGE_CACHE.delete(key);
    ZONAGE_CACHE.set(key, cached);
    return cached;
  }
  const data = await fetchLayerEsri(
    AUC_LAYERS.zonage,
    bbox,
    ["id", "zone", "secteur", "commune", "prefecture", "area", "label", "name", "origine"],
    signal,
  );
  const fc = esriToGeojson<ZoneAttributes>(data, "zonage");
  ZONAGE_CACHE.set(key, fc);
  if (ZONAGE_CACHE.size > ZONAGE_CACHE_MAX) {
    const first = ZONAGE_CACHE.keys().next().value;
    if (first) ZONAGE_CACHE.delete(first);
  }
  return fc;
}

export async function fetchEquipements(
  bbox: BBox4326,
  signal?: AbortSignal,
): Promise<GeoJSON.FeatureCollection> {
  const data = await fetchLayerEsri(
    AUC_LAYERS.equipements,
    bbox,
    ["id", "nature", "area", "label"],
    signal,
  );
  return esriToGeojson<EquipementAttributes>(data, "equipements");
}

/**
 * Calcule la famille de zone (A, B, C, D, E, I, PB, PU, S, ZR…) à partir
 * du code de sous-secteur (B4, E2, A6, PBC5'…). Utilisé pour colorer la
 * carte sans avoir à monter une expression MapLibre tordue.
 */
export function familleOf(secteur: unknown): string {
  if (typeof secteur !== "string") return "?";
  const s = secteur.trim();
  if (!s) return "?";
  if (s.startsWith("PB")) return "PB";
  if (s.startsWith("PU")) return "PU";
  if (s.startsWith("ZR")) return "ZR";
  return s.charAt(0).toUpperCase();
}

function esriToGeojson<A>(
  data: EsriResponse,
  layerKey: AucLayer,
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const f of data.features ?? []) {
    const rings = f.geometry?.rings;
    if (!rings || rings.length === 0) continue;
    const id = typeof f.attributes.id === "number" ? f.attributes.id : 0;
    const famille = familleOf((f.attributes as { secteur?: unknown }).secteur);
    features.push({
      type: "Feature",
      properties: {
        ...(f.attributes as A),
        aucId: id,
        aucLayer: layerKey,
        famille,
      },
      geometry: ringsToPolygon(rings),
    });
  }
  return { type: "FeatureCollection", features };
}
