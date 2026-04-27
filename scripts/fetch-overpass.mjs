// Récupère les bâtiments et le périmètre administratif d'Aïn Chock
// depuis OpenStreetMap. Étapes :
//   1. Nominatim → relation OSM correspondant à l'arrondissement
//   2. Overpass → géométrie du périmètre + tous les bâtiments du bbox
//   3. Écriture en GeoJSON dans data/ainchock/
//
// Données sous licence ODbL — © OpenStreetMap contributors.

import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
// Source de vérité (versionnée) ET copie servie en statique par Vite.
const outDirs = [
  resolve(root, "data/ainchock"),
  resolve(root, "apps/web/public/data/ainchock"),
];

const HEADERS = {
  "User-Agent": "casa-urban-mvp/0.1 (contact: abdellah.benkirane@gmail.com)",
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function overpass(query) {
  const url = OVERPASS_ENDPOINTS[0];
  const body = new URLSearchParams({ data: query }).toString();
  let lastErr;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`→ ${endpoint}`);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...HEADERS,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (e) {
      console.warn(`  failed: ${e.message}`);
      lastErr = e;
    }
  }
  throw lastErr;
}

// --- 1. Trouver la relation OSM via Nominatim ---
console.log("Recherche de la relation OSM d'Aïn Chock via Nominatim…");
const nomUrl =
  "https://nominatim.openstreetmap.org/search?" +
  new URLSearchParams({
    q: "Aïn Chock, Casablanca, Morocco",
    format: "json",
    addressdetails: "1",
    polygon_geojson: "0",
    limit: "5",
  });
const nomRes = await fetch(nomUrl, { headers: HEADERS });
if (!nomRes.ok) throw new Error(`Nominatim HTTP ${nomRes.status}`);
const nomList = await nomRes.json();
const adminMatch = nomList.find(
  (r) => r.osm_type === "relation" && /boundary|administrative/i.test(r.class || r.type || ""),
);
const candidate = adminMatch ?? nomList.find((r) => r.osm_type === "relation");
if (!candidate) {
  console.log("Réponses Nominatim brutes :", JSON.stringify(nomList, null, 2));
  throw new Error("Aucune relation OSM trouvée pour Aïn Chock");
}
const relId = candidate.osm_id;
console.log(
  `  trouvé : relation ${relId} — ${candidate.display_name} (class=${candidate.class}, type=${candidate.type})`,
);

// --- 2. Récupérer la géométrie du périmètre ---
console.log("Récupération du périmètre…");
const perimQuery = `[out:json][timeout:60];relation(${relId});out geom;`;
const perim = await overpass(perimQuery);
const perimRel = perim.elements.find((e) => e.type === "relation");
if (!perimRel) throw new Error(`Relation ${relId} sans géométrie`);

const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
function joinRings(ways) {
  const rings = [];
  const remaining = ways.map((w) => [...w]);
  while (remaining.length) {
    let ring = remaining.shift();
    let extended = true;
    while (extended) {
      extended = false;
      for (let i = 0; i < remaining.length; i++) {
        const w = remaining[i];
        const head = ring[0];
        const tail = ring[ring.length - 1];
        if (eq(tail, w[0])) {
          ring = ring.concat(w.slice(1));
          remaining.splice(i, 1);
          extended = true;
          break;
        } else if (eq(tail, w[w.length - 1])) {
          ring = ring.concat([...w].reverse().slice(1));
          remaining.splice(i, 1);
          extended = true;
          break;
        } else if (eq(head, w[w.length - 1])) {
          ring = w.concat(ring.slice(1));
          remaining.splice(i, 1);
          extended = true;
          break;
        } else if (eq(head, w[0])) {
          ring = [...w].reverse().concat(ring.slice(1));
          remaining.splice(i, 1);
          extended = true;
          break;
        }
      }
    }
    rings.push(ring);
  }
  return rings;
}

const outerWays = (perimRel.members ?? [])
  .filter((m) => m.type === "way" && m.role === "outer" && Array.isArray(m.geometry))
  .map((m) => m.geometry.map((p) => [p.lon, p.lat]));
const rings = joinRings(outerWays);

const perimFeature = {
  type: "Feature",
  properties: {
    id: `OSM-RELATION-${relId}`,
    name: perimRel.tags?.name ?? candidate.display_name,
    admin_level: perimRel.tags?.admin_level,
  },
  geometry:
    rings.length === 1
      ? { type: "Polygon", coordinates: [rings[0]] }
      : { type: "MultiPolygon", coordinates: rings.map((r) => [r]) },
};
const perimFc = {
  type: "FeatureCollection",
  _meta: {
    source: `OpenStreetMap relation ${relId} via Overpass`,
    license: "ODbL — © OpenStreetMap contributors",
    generated: new Date().toISOString(),
  },
  features: [perimFeature],
};

for (const d of outDirs) {
  await mkdir(d, { recursive: true });
  await writeFile(resolve(d, "perimetre.geojson"), JSON.stringify(perimFc));
}
console.log(`Périmètre écrit (${rings.length} anneau(x))`);

// --- 3. Récupérer les bâtiments dans le bbox ---
function boundsOf(rs) {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const r of rs) for (const [lng, lat] of r) {
    if (lng < west) west = lng;
    if (lng > east) east = lng;
    if (lat < south) south = lat;
    if (lat > north) north = lat;
  }
  return [west, south, east, north];
}
const [w, s, e, n] = boundsOf(rings);
console.log(`Bbox : (${s.toFixed(4)}, ${w.toFixed(4)}) — (${n.toFixed(4)}, ${e.toFixed(4)})`);

console.log("Récupération des bâtiments…");
const buildingsQuery = `[out:json][timeout:180];(way["building"](${s},${w},${n},${e}););out geom;`;
const bld = await overpass(buildingsQuery);
const buildings = bld.elements
  .filter((el) => el.type === "way" && Array.isArray(el.geometry) && el.geometry.length >= 4)
  .map((el) => ({
    type: "Feature",
    properties: {
      id: `OSM-WAY-${el.id}`,
      building: el.tags?.building ?? "yes",
      ...(el.tags?.name ? { name: el.tags.name } : {}),
      ...(el.tags?.["addr:street"] ? { street: el.tags["addr:street"] } : {}),
      ...(el.tags?.["building:levels"]
        ? { levels: Number(el.tags["building:levels"]) }
        : {}),
    },
    geometry: {
      type: "Polygon",
      coordinates: [el.geometry.map((p) => [p.lon, p.lat])],
    },
  }));

const buildingsFc = {
  type: "FeatureCollection",
  _meta: {
    source: "OpenStreetMap via Overpass — bâtiments d'Aïn Chock",
    license: "ODbL — © OpenStreetMap contributors",
    generated: new Date().toISOString(),
    count: buildings.length,
    note: "Filtré sur les ways tagués building=*. À remplacer/enrichir avec les vraies parcelles cadastrales du PAU lorsqu'elles seront disponibles.",
  },
  features: buildings,
};

for (const d of outDirs) {
  await writeFile(resolve(d, "buildings.geojson"), JSON.stringify(buildingsFc));
}
console.log(`Bâtiments écrits : ${buildings.length}`);

console.log(`\nFichiers générés :`);
for (const d of outDirs) console.log(`  - ${d}`);
