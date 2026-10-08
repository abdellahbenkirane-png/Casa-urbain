import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchZonage } from "./aucService";

// Carré de 10 × 10 (sens horaire = extérieur ESRI) et trou 2 × 2 (anti-horaire).
const outer = [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]];
const hole = [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]];
const outer2 = [[20, 0], [20, 5], [25, 5], [25, 0], [20, 0]];

function mockAuc(features: unknown[]) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ features }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

let n = 0;
const bbox = () => ({ W: -7.6, E: -7.59, S: 33.5 + n * 0.01, N: 33.51 + n++ * 0.01 }); // emprise unique : pas de cache

afterEach(() => vi.unstubAllGlobals());

describe("conversion ESRI → GeoJSON", () => {
  it("rattache un trou à sa zone au lieu d'en faire un polygone plein", async () => {
    mockAuc([{ attributes: { id: 1, secteur: "D4" }, geometry: { rings: [outer, hole] } }]);
    const fc = await fetchZonage(bbox());
    const g = fc.features[0]!.geometry as GeoJSON.Polygon;
    expect(g.type).toBe("Polygon");
    expect(g.coordinates).toHaveLength(2); // extérieur + trou
  });

  it("garde plusieurs morceaux distincts en MultiPolygon", async () => {
    mockAuc([{ attributes: { id: 2, secteur: "B5" }, geometry: { rings: [outer, outer2, hole] } }]);
    const g = (await fetchZonage(bbox())).features[0]!.geometry as GeoJSON.MultiPolygon;
    expect(g.type).toBe("MultiPolygon");
    expect(g.coordinates).toHaveLength(2);
    expect(g.coordinates[0]).toHaveLength(2); // le trou va dans le premier carré
    expect(g.coordinates[1]).toHaveLength(1);
  });

  it("reprojette le Web Mercator en degrés", async () => {
    // −7,6° de longitude ≈ −846 000 m en Web Mercator
    const merc = [[-846000, 3966000], [-846000, 3967000], [-845000, 3967000], [-845000, 3966000], [-846000, 3966000]];
    mockAuc([{ attributes: { id: 3, secteur: "E2" }, geometry: { rings: [merc] } }]);
    const g = (await fetchZonage(bbox())).features[0]!.geometry as GeoJSON.Polygon;
    const [lng, lat] = g.coordinates[0]![0]!;
    expect(lng).toBeCloseTo(-7.6, 1);
    expect(lat).toBeGreaterThan(33);
    expect(lat).toBeLessThan(34);
  });

  it("ajoute l'identifiant et la famille de zone", async () => {
    mockAuc([
      { attributes: { id: 42, secteur: " PU2 " }, geometry: { rings: [outer] } },
      { attributes: { id: 43, secteur: "ZUG" }, geometry: { rings: [outer] } },
      { attributes: { id: 44 }, geometry: {} }, // sans géométrie : ignorée
    ]);
    const fc = await fetchZonage(bbox());
    expect(fc.features).toHaveLength(2);
    expect(fc.features[0]!.properties).toMatchObject({ aucId: 42, famille: "PU" });
    expect(fc.features[1]!.properties).toMatchObject({ aucId: 43, famille: "Z" });
  });

  it("met en cache une emprise déjà demandée", async () => {
    const fetchMock = mockAuc([{ attributes: { id: 5, secteur: "B5" }, geometry: { rings: [outer] } }]);
    const b = bbox();
    await fetchZonage(b);
    await fetchZonage(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejette une erreur ArcGIS renvoyée en HTTP 200 (sans la mettre en cache)", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ error: { code: 500 } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const b = bbox();
    await expect(fetchZonage(b)).rejects.toThrow(/sans zonage/);
    await expect(fetchZonage(b)).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("remonte une erreur HTTP du relais", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 502 })));
    await expect(fetchZonage(bbox())).rejects.toThrow(/502/);
  });
});
