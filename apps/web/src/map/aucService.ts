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

const API_ROOT = "https://e-auc.org/karazal/kgis/rest/featuresService/features";

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
  return `${API_ROOT}/${layer}/all/1/query?${params.toString()}`;
}

function ringsToPolygon(rings: number[][][]): GeoJSON.Polygon | GeoJSON.MultiPolygon {
  // ESRI : 1er ring = extérieur ; suivants éventuels = trous (sens horaire)
  // Pour rester simple on traite chaque ring comme un polygone séparé d'un MultiPolygon
  // et on laisse MapLibre faire le rendu (pas critique à ce stade).
  if (rings.length === 1) {
    return { type: "Polygon", coordinates: rings };
  }
  return { type: "MultiPolygon", coordinates: rings.map((r) => [r]) };
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
  const features: GeoJSON.Feature[] = [];
  for (const f of data.features ?? []) {
    const rings = f.geometry?.rings;
    if (!rings || rings.length === 0) continue;
    const id = typeof f.attributes.id === "number" ? f.attributes.id : 0;
    features.push({
      type: "Feature",
      properties: { ...(f.attributes as A), aucId: id, aucLayer: layerKey },
      geometry: ringsToPolygon(rings),
    });
  }
  return { type: "FeatureCollection", features };
}
