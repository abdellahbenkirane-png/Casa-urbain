// Client minimaliste pour le service ArcGIS REST de l'Agence Urbaine de Casablanca
// (https://e-auc.org/karazal). Pas de SDK ESRI : appel direct + conversion ESRI → GeoJSON.
//
// Découvert via l'inspection du géoportail public e-auc.org/karazal :
//   GET /karazal/kgis/rest/featuresService/features/{layer}/all/1/query
//   Headers : CORS ouvert (Access-Control-Allow-Origin: *)
//   Sortie : { features: [{attributes, geometry: {rings}}], spatialReference: {wkid: 102100} }
//
// IDs des calques à confirmer/compléter au fur et à mesure de l'inspection
// du géoportail. Mettre à jour ce fichier sans toucher au reste du code.
export const AUC_LAYERS = {
  /**
   * Zonage du PAU — features avec attributs `zone` ("ZONE A", "ZONE B"...)
   * et `secteur` ("A6", "B4", "E3"...). Aligné sur data/reglement/pau-zones.json.
   */
  zonage: "Layer-579748",
  /**
   * Équipements & espaces publics — attribut `nature` (EQUIPEMENT DE SANTE,
   * EQUIPEMENT ENSEIGNEMENT, ESPACE VERT, PARKING, CIMETIERE…).
   */
  equipements: "Layer-579748",
} as const;

export type AucLayer = keyof typeof AUC_LAYERS;

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

// Inverse Mercator sphérique — converti EPSG:3857 → EPSG:4326.
// Utile parce que karazal renvoie les rings en Web Mercator même quand
// on demande outSR=4326 (paramètre ignoré côté serveur).
const R_EARTH = 6378137;
const RAD_TO_DEG = 180 / Math.PI;

function mercToWgs84([x, y]: [number, number]): [number, number] {
  const lng = (x / R_EARTH) * RAD_TO_DEG;
  const lat = (2 * Math.atan(Math.exp(y / R_EARTH)) - Math.PI / 2) * RAD_TO_DEG;
  return [lng, lat];
}

function isWebMercator(sr?: { wkid?: number; latestWkid?: number }): boolean {
  if (!sr) return false;
  const code = sr.latestWkid ?? sr.wkid;
  return code === 3857 || code === 102100;
}

function ringsToPolygon(
  rings: number[][][],
  reprojectFromMerc: boolean,
): GeoJSON.Polygon | GeoJSON.MultiPolygon {
  const project = reprojectFromMerc
    ? (ring: number[][]) => ring.map((p) => mercToWgs84([p[0]!, p[1]!]))
    : (ring: number[][]) => ring.map((p) => [p[0]!, p[1]!] as [number, number]);
  if (rings.length === 1) {
    return { type: "Polygon", coordinates: [project(rings[0]!)] };
  }
  return { type: "MultiPolygon", coordinates: rings.map((r) => [project(r)]) };
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

export async function fetchZonage(
  bbox: BBox4326,
  signal?: AbortSignal,
): Promise<GeoJSON.FeatureCollection> {
  const data = await fetchLayerEsri(
    AUC_LAYERS.zonage,
    bbox,
    ["id", "zone", "secteur", "commune", "prefecture", "area", "label", "name", "origine"],
    signal,
  );
  return esriToGeojson<ZoneAttributes>(data, "zonage");
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

function esriToGeojson<A>(
  data: EsriResponse,
  layerKey: AucLayer,
): GeoJSON.FeatureCollection {
  const reproject = isWebMercator(data.spatialReference);
  const features: GeoJSON.Feature[] = [];
  for (const f of data.features ?? []) {
    const rings = f.geometry?.rings;
    if (!rings || rings.length === 0) continue;
    const id = typeof f.attributes.id === "number" ? f.attributes.id : 0;
    features.push({
      type: "Feature",
      properties: { ...(f.attributes as A), aucId: id, aucLayer: layerKey },
      geometry: ringsToPolygon(rings, reproject),
    });
  }
  return { type: "FeatureCollection", features };
}
