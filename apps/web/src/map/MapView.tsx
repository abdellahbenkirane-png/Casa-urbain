import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MlMap } from "maplibre-gl";
import parcellesRaw from "../../../../data/ainchock/parcelles.geojson?raw";
import { fetchZonage, setZonageLayerId, AUC_LAYERS } from "./aucService";

const PARCELLES_DATA = JSON.parse(parcellesRaw) as GeoJSON.FeatureCollection;

interface Props {
  onParcelSelect: (props: ParcelleProperties) => void;
}

export interface ParcelleProperties {
  id: string;
  adresse: string;
  zone: string;
  surface: number;
  facade1?: number;
  facade2?: number;
  prixTerrainMedianDhM2: number;
}

// Couleur dérivée de la famille de zone (A, B, C, D, E, I, PB, PU, S, ZR).
const ZONE_COLORS: Record<string, string> = {
  A: "#2f81f7",
  B: "#58a6ff",
  C: "#79c0ff",
  D: "#3fb950",
  E: "#a5d6ff",
  I: "#a371f7",
  PB: "#f0883e",
  PU: "#db61a2",
  S: "#d29922",
  ZR: "#8b949e",
};

// Prix de terrain médian estimé par famille de zone (DH/m²).
// À remplacer par des références marché réelles une fois disponibles.
const PRIX_PAR_FAMILLE: Record<string, number> = {
  A: 23000,
  B: 18000,
  C: 16000,
  D: 15000,
  E: 12000,
  I: 8000,
  PB: 14000,
  PU: 17000,
  S: 10000,
  ZR: 11000,
};

interface BBox { W: number; E: number; S: number; N: number }

const DEFAULT_BBOX: BBox = { W: -7.673, E: -7.566, S: 33.4685, N: 33.5843 };

function familleOfSecteur(secteur: string): string {
  if (secteur.startsWith("PB")) return "PB";
  if (secteur.startsWith("PU")) return "PU";
  if (secteur.startsWith("ZR")) return "ZR";
  return secteur.charAt(0).toUpperCase();
}

/**
 * Calcule la surface en m² d'un polygone donné en lng/lat (WGS 84) en
 * utilisant la formule sphérique standard (rayon terrestre = 6 378 137 m).
 * Précis à <0.1 % à l'échelle d'une parcelle urbaine.
 */
function geodesicArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const R = 6378137;
  const ring = [...coords];
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first);
  let total = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i]!;
    const [lng2, lat2] = ring[i + 1]!;
    total +=
      (((lng2 - lng1) * Math.PI) / 180) *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }
  return Math.abs((total * R * R) / 2);
}

function PlancheCalibration({
  bbox,
  setBbox,
  onClose,
}: {
  bbox: BBox;
  setBbox: (b: BBox) => void;
  onClose: () => void;
}) {
  const NUDGE_LNG = 0.0005;
  const NUDGE_LAT = 0.0005;
  const SCALE_STEP = 0.005;

  const move = (dx: number, dy: number) =>
    setBbox({ W: bbox.W + dx, E: bbox.E + dx, S: bbox.S + dy, N: bbox.N + dy });
  const scale = (factor: number) => {
    const cx = (bbox.W + bbox.E) / 2;
    const cy = (bbox.S + bbox.N) / 2;
    const w = (bbox.E - bbox.W) * factor;
    const h = (bbox.N - bbox.S) * factor;
    setBbox({ W: cx - w / 2, E: cx + w / 2, S: cy - h / 2, N: cy + h / 2 });
  };
  const stretchH = (factor: number) => {
    const cx = (bbox.W + bbox.E) / 2;
    const w = (bbox.E - bbox.W) * factor;
    setBbox({ ...bbox, W: cx - w / 2, E: cx + w / 2 });
  };
  const stretchV = (factor: number) => {
    const cy = (bbox.S + bbox.N) / 2;
    const h = (bbox.N - bbox.S) * factor;
    setBbox({ ...bbox, S: cy - h / 2, N: cy + h / 2 });
  };

  return (
    <div className="planche-calib">
      <div className="planche-calib-row">
        <strong>Caler la planche</strong>
        <button className="btn-mini" onClick={onClose}>✕</button>
      </div>
      <div className="planche-calib-grid">
        <span></span>
        <button className="btn-mini" onClick={() => move(0, NUDGE_LAT)}>↑</button>
        <span></span>
        <button className="btn-mini" onClick={() => move(-NUDGE_LNG, 0)}>←</button>
        <button className="btn-mini" onClick={() => setBbox(DEFAULT_BBOX)} title="Reset">⟳</button>
        <button className="btn-mini" onClick={() => move(NUDGE_LNG, 0)}>→</button>
        <span></span>
        <button className="btn-mini" onClick={() => move(0, -NUDGE_LAT)}>↓</button>
        <span></span>
      </div>
      <div className="planche-calib-row">
        <span>Échelle :</span>
        <button className="btn-mini" onClick={() => scale(1 - SCALE_STEP)}>−</button>
        <button className="btn-mini" onClick={() => scale(1 + SCALE_STEP)}>+</button>
      </div>
      <div className="planche-calib-row">
        <span>Largeur :</span>
        <button className="btn-mini" onClick={() => stretchH(1 - SCALE_STEP)}>−</button>
        <button className="btn-mini" onClick={() => stretchH(1 + SCALE_STEP)}>+</button>
      </div>
      <div className="planche-calib-row">
        <span>Hauteur :</span>
        <button className="btn-mini" onClick={() => stretchV(1 - SCALE_STEP)}>−</button>
        <button className="btn-mini" onClick={() => stretchV(1 + SCALE_STEP)}>+</button>
      </div>
      <div className="planche-calib-coords">
        W {bbox.W.toFixed(4)} · E {bbox.E.toFixed(4)} <br />
        S {bbox.S.toFixed(4)} · N {bbox.N.toFixed(4)}
      </div>
    </div>
  );
}

export function MapView({ onParcelSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planche, setPlanche] = useState(false);
  const [plancheOpacity, setPlancheOpacity] = useState(0.65);
  const [aucZonage, setAucZonage] = useState(true);
  const [aucStatus, setAucStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [aucCount, setAucCount] = useState(0);
  const [layerInput, setLayerInput] = useState(AUC_LAYERS.zonage);
  const [layerEditing, setLayerEditing] = useState(false);
  const [satellite, setSatellite] = useState(true);
  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [drawArea, setDrawArea] = useState<number | null>(null);
  const [drawFinalized, setDrawFinalized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(
    typeof window === "undefined" ? true : window.innerWidth > 768,
  );
  const [bbox, setBbox] = useState<BBox>(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("planche-bbox") : null;
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallthrough
      }
    }
    return DEFAULT_BBOX;
  });
  const [calibrating, setCalibrating] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: MlMap;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            base: {
              type: "raster",
              tiles: [
                "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
                "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
                "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors © CARTO",
            },
            satellite: {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, GIS User Community",
            },
          },
          layers: [
            { id: "base", type: "raster", source: "base" },
            { id: "satellite", type: "raster", source: "satellite", layout: { visibility: "none" } },
          ],
        },
        center: [-7.585, 33.535],
        zoom: 14,
      });
      mapRef.current = map;
    } catch (e) {
      setError(String(e));
      return;
    }

    map.on("error", (e) => {
      const msg = e.error?.message ?? String(e);
      setError(
        /Failed to fetch|NetworkError|blocked/i.test(msg)
          ? "Tuiles bloquées — désactive bloqueurs/extensions et recharge."
          : msg,
      );
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showAccuracyCircle: true,
        showUserLocation: true,
      }),
      "top-right",
    );

    map.on("load", async () => {
      try {
        // 0. Planche PAU d'Aïn Chock — overlay raster
        map.addSource("planche", {
          type: "image",
          url: "/data/ainchock/pau-planche.jpg",
          coordinates: [
            [bbox.W, bbox.N],
            [bbox.E, bbox.N],
            [bbox.E, bbox.S],
            [bbox.W, bbox.S],
          ],
        });
        map.addLayer({
          id: "planche-layer",
          type: "raster",
          source: "planche",
          paint: { "raster-opacity": 0, "raster-fade-duration": 0 },
        });

        // 1. Périmètre administratif (OSM)
        try {
          const perim = await fetch("/data/ainchock/perimetre.geojson").then((r) =>
            r.ok ? r.json() : null,
          );
          if (perim) {
            map.addSource("perimetre", { type: "geojson", data: perim });
            map.addLayer({
              id: "perimetre-line",
              type: "line",
              source: "perimetre",
              paint: { "line-color": "#2f81f7", "line-width": 2, "line-dasharray": [3, 2] },
            });
          }
        } catch (e) {
          console.warn("[MapView] périmètre indisponible", e);
        }

        // 2. Bâtiments OSM (calque informatif, non cliquable)
        try {
          const buildings = await fetch("/data/ainchock/buildings.geojson").then((r) =>
            r.ok ? r.json() : null,
          );
          if (buildings) {
            map.addSource("buildings", { type: "geojson", data: buildings });
            map.addLayer({
              id: "buildings-fill",
              type: "fill",
              source: "buildings",
              paint: { "fill-color": "#8b949e", "fill-opacity": 0.35 },
            });
            map.addLayer({
              id: "buildings-outline",
              type: "line",
              source: "buildings",
              paint: { "line-color": "#30363d", "line-width": 0.5 },
            });
          }
        } catch (e) {
          console.warn("[MapView] bâtiments indisponibles", e);
        }

        // 3. AUC Zonage (vide à l'init, peuplé à la demande via toggle + map idle)
        map.addSource("auc-zonage", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        // L'attribut "famille" est calculé au fetch (cf. aucService.familleOf),
        // donc le match MapLibre est trivialement direct.
        const aucColorExpr: maplibregl.ExpressionSpecification = [
          "match",
          ["coalesce", ["get", "famille"], "?"],
          "A", ZONE_COLORS.A!,
          "B", ZONE_COLORS.B!,
          "C", ZONE_COLORS.C!,
          "D", ZONE_COLORS.D!,
          "E", ZONE_COLORS.E!,
          "I", ZONE_COLORS.I!,
          "PB", ZONE_COLORS.PB!,
          "PU", ZONE_COLORS.PU!,
          "S", ZONE_COLORS.S!,
          "ZR", ZONE_COLORS.ZR!,
          "#888", // gris discret pour les familles non répertoriées
        ];
        map.addLayer({
          id: "auc-zonage-fill",
          type: "fill",
          source: "auc-zonage",
          paint: { "fill-color": aucColorExpr, "fill-opacity": 0 },
        });
        map.addLayer({
          id: "auc-zonage-outline",
          type: "line",
          source: "auc-zonage",
          paint: { "line-color": "#0e1116", "line-width": 1.5, "line-opacity": 0 },
        });

        // 4. Parcelles de démo (fallback quand AUC désactivé)
        map.addSource("parcelles", { type: "geojson", data: PARCELLES_DATA });
        const parcelBounds = new maplibregl.LngLatBounds();
        for (const f of PARCELLES_DATA.features) {
          const g = f.geometry as GeoJSON.Polygon | undefined;
          const coords = g?.coordinates?.[0];
          if (Array.isArray(coords)) {
            for (const [lng, lat] of coords) parcelBounds.extend([lng, lat]);
          }
        }
        if (!parcelBounds.isEmpty()) {
          map.fitBounds(parcelBounds, { padding: 80, maxZoom: 17, duration: 0 });
        }

        const familleExpr: maplibregl.ExpressionSpecification = [
          "case",
          ["==", ["slice", ["get", "zone"], 0, 2], "PB"], "PB",
          ["==", ["slice", ["get", "zone"], 0, 2], "PU"], "PU",
          ["==", ["slice", ["get", "zone"], 0, 2], "ZR"], "ZR",
          ["slice", ["get", "zone"], 0, 1],
        ];
        const matchExpr: maplibregl.ExpressionSpecification = [
          "match",
          familleExpr,
          "A", ZONE_COLORS.A!,
          "B", ZONE_COLORS.B!,
          "C", ZONE_COLORS.C!,
          "D", ZONE_COLORS.D!,
          "E", ZONE_COLORS.E!,
          "I", ZONE_COLORS.I!,
          "PB", ZONE_COLORS.PB!,
          "PU", ZONE_COLORS.PU!,
          "S", ZONE_COLORS.S!,
          "ZR", ZONE_COLORS.ZR!,
          "#888",
        ];
        map.addLayer({
          id: "parcelles-fill",
          type: "fill",
          source: "parcelles",
          paint: { "fill-color": matchExpr, "fill-opacity": 0.7 },
        });
        map.addLayer({
          id: "parcelles-outline",
          type: "line",
          source: "parcelles",
          paint: { "line-color": "#fff", "line-width": 2 },
        });

        // 4. Outil de mesure — polygone en cours de dessin (fill + line + points)
        const emptyFc: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: [],
        };
        map.addSource("draw-fill", { type: "geojson", data: emptyFc });
        map.addSource("draw-line", { type: "geojson", data: emptyFc });
        map.addSource("draw-points", { type: "geojson", data: emptyFc });
        map.addLayer({
          id: "draw-fill-layer",
          type: "fill",
          source: "draw-fill",
          paint: { "fill-color": "#facc15", "fill-opacity": 0.3 },
        });
        map.addLayer({
          id: "draw-line-layer",
          type: "line",
          source: "draw-line",
          paint: { "line-color": "#facc15", "line-width": 2 },
        });
        map.addLayer({
          id: "draw-points-layer",
          type: "circle",
          source: "draw-points",
          paint: {
            "circle-radius": 5,
            "circle-color": "#facc15",
            "circle-stroke-color": "#0e1116",
            "circle-stroke-width": 1.5,
          },
        });

        // Click handlers
        map.on("click", "parcelles-fill", (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          onParcelSelect(feature.properties as ParcelleProperties);
        });
        map.on("click", "auc-zonage-fill", (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          const a = feature.properties as Record<string, unknown>;
          const secteur = String(a.secteur ?? "").trim();
          if (!secteur) return;
          // L'attribut `area` est la surface du polygone de zone (souvent
          // plusieurs hectares — ce n'est PAS une parcelle individuelle).
          // On part sur une parcelle type 500 m² que l'utilisateur ajustera
          // dans le formulaire avec le m² réel de son terrain.
          const surface = 500;
          const famille = familleOfSecteur(secteur);
          onParcelSelect({
            id: `AUC-${a.aucId ?? a.id ?? "?"}`,
            adresse: `${a.commune ?? "Aïn Chock"} · secteur ${secteur}`,
            zone: secteur,
            surface,
            prixTerrainMedianDhM2: PRIX_PAR_FAMILLE[famille] ?? 15000,
          });
        });
        const setPointer = (l: string) => {
          map.on("mouseenter", l, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", l, () => {
            map.getCanvas().style.cursor = "";
          });
        };
        setPointer("parcelles-fill");
        setPointer("auc-zonage-fill");
      } catch (e) {
        setError(String(e));
      }
    });

    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
    };
  }, [onParcelSelect]);

  // Opacité planche
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("planche-layer")) return;
    map.setPaintProperty("planche-layer", "raster-opacity", planche ? plancheOpacity : 0);
  }, [planche, plancheOpacity]);

  // Bascule fond carto / satellite
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getLayer("base") || !map.getLayer("satellite")) return;
      map.setLayoutProperty("base", "visibility", satellite ? "none" : "visible");
      map.setLayoutProperty("satellite", "visibility", satellite ? "visible" : "none");
    };
    if (map.loaded()) apply();
    else map.once("load", apply);
  }, [satellite]);

  // Mode dessin : clics ajoutent un sommet ; double-clic / Entrée finalise.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !drawMode || drawFinalized) return;

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const p: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setDrawPoints((pts) => [...pts, p]);
    };
    const onDblClick = (e: maplibregl.MapMouseEvent) => {
      e.preventDefault();
      setDrawFinalized(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") setDrawFinalized(true);
      if (e.key === "Escape") {
        setDrawMode(false);
        setDrawPoints([]);
        setDrawFinalized(false);
        setDrawArea(null);
      }
    };

    map.getCanvas().style.cursor = "crosshair";
    map.doubleClickZoom.disable();
    map.on("click", onClick);
    map.on("dblclick", onDblClick);
    window.addEventListener("keydown", onKey);

    return () => {
      map.getCanvas().style.cursor = "";
      map.doubleClickZoom.enable();
      map.off("click", onClick);
      map.off("dblclick", onDblClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [drawMode, drawFinalized]);

  // Met à jour les sources GeoJSON du calque dessin et calcule l'aire.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const ptsSrc = map.getSource("draw-points") as maplibregl.GeoJSONSource | undefined;
      const lineSrc = map.getSource("draw-line") as maplibregl.GeoJSONSource | undefined;
      const fillSrc = map.getSource("draw-fill") as maplibregl.GeoJSONSource | undefined;
      if (!ptsSrc || !lineSrc || !fillSrc) return;

      ptsSrc.setData({
        type: "FeatureCollection",
        features: drawPoints.map((p, i) => ({
          type: "Feature",
          properties: { i },
          geometry: { type: "Point", coordinates: p },
        })),
      });

      if (drawPoints.length >= 2) {
        const lineCoords = drawFinalized && drawPoints.length >= 3
          ? [...drawPoints, drawPoints[0]!]
          : drawPoints;
        lineSrc.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: lineCoords },
            },
          ],
        });
      } else {
        lineSrc.setData({ type: "FeatureCollection", features: [] });
      }

      if (drawPoints.length >= 3) {
        const ring = [...drawPoints, drawPoints[0]!];
        fillSrc.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "Polygon", coordinates: [ring] },
            },
          ],
        });
        setDrawArea(geodesicArea(drawPoints));
      } else {
        fillSrc.setData({ type: "FeatureCollection", features: [] });
        setDrawArea(null);
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [drawPoints, drawFinalized]);

  const resetDraw = () => {
    setDrawPoints([]);
    setDrawArea(null);
    setDrawFinalized(false);
  };
  const useDrawAsParcel = () => {
    if (!drawArea) return;
    onParcelSelect({
      id: `MESURE-${Date.now().toString(36)}`,
      adresse: "Parcelle dessinée à la main",
      zone: "A6",
      surface: Math.round(drawArea),
      prixTerrainMedianDhM2: 18000,
    });
  };

  // Coins planche
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const src = map.getSource("planche") as maplibregl.ImageSource | undefined;
    if (src && "setCoordinates" in src) {
      src.setCoordinates([
        [bbox.W, bbox.N],
        [bbox.E, bbox.N],
        [bbox.E, bbox.S],
        [bbox.W, bbox.S],
      ]);
    }
    try {
      localStorage.setItem("planche-bbox", JSON.stringify(bbox));
    } catch {
      // localStorage indisponible
    }
  }, [bbox]);

  // Toggle "Zonage AUC" : on joue sur l'opacité plutôt que la visibilité
  // pour éviter les courses entre la création des layers (load) et le clic
  // utilisateur. Retry jusqu'à 5 s si la layer n'existe pas encore.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let retries = 0;
    const apply = () => {
      if (!map.getLayer("auc-zonage-fill")) {
        if (retries++ < 50) setTimeout(apply, 100);
        return;
      }
      map.setPaintProperty("auc-zonage-fill", "fill-opacity", aucZonage ? 0.32 : 0);
      map.setPaintProperty("auc-zonage-outline", "line-opacity", aucZonage ? 0.9 : 0);
      if (map.getLayer("parcelles-fill")) {
        const hide = aucZonage && aucCount > 0;
        map.setPaintProperty("parcelles-fill", "fill-opacity", hide ? 0 : 0.7);
        map.setPaintProperty("parcelles-outline", "line-opacity", hide ? 0 : 1);
      }
    };
    apply();
  }, [aucZonage, aucCount]);

  // Récupération des features AUC quand zonage actif et que la carte bouge
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !aucZonage) return;
    let abort: AbortController | null = null;

    const setSourceData = (fc: GeoJSON.FeatureCollection, retries = 0) => {
      const src = map.getSource("auc-zonage") as maplibregl.GeoJSONSource | undefined;
      if (!src) {
        if (retries < 50) {
          setTimeout(() => setSourceData(fc, retries + 1), 100);
          return;
        }
        console.warn("[MapView] AUC source jamais créée — abandon");
        return;
      }
      src.setData(fc);
    };

    const refresh = async () => {
      const b = map.getBounds();
      const aucBbox = {
        W: b.getWest(),
        E: b.getEast(),
        S: b.getSouth(),
        N: b.getNorth(),
      };
      abort?.abort();
      abort = new AbortController();
      setAucStatus("loading");
      try {
        const fc = await fetchZonage(aucBbox, abort.signal);
        setSourceData(fc);
        setAucCount(fc.features.length);
        setAucStatus("ok");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        console.warn("[MapView] AUC zonage fetch failed", e);
        setAucStatus("error");
      }
    };

    refresh();
    map.on("moveend", refresh);
    return () => {
      abort?.abort();
      map.off("moveend", refresh);
    };
  }, [aucZonage]);

  return (
    <>
      <div ref={containerRef} className="map" />
      <button
        className="menu-btn"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {menuOpen ? "✕" : "☰"} Calques
      </button>
      <div className={`map-toolbar ${menuOpen ? "is-open" : ""}`}>
        <label className="map-toolbar-toggle">
          <input
            type="checkbox"
            checked={satellite}
            onChange={(e) => setSatellite(e.target.checked)}
          />
          <span>Satellite</span>
        </label>
        <label className="map-toolbar-toggle">
          <input
            type="checkbox"
            checked={aucZonage}
            onChange={(e) => setAucZonage(e.target.checked)}
          />
          <span>Zonage AUC</span>
        </label>
        {aucZonage && (
          <>
            <span className="auc-status">
              {aucStatus === "loading" && "⏳ chargement…"}
              {aucStatus === "ok" && `✓ ${aucCount} polygones`}
              {aucStatus === "error" && "⚠ AUC indisponible"}
            </span>
            <button className="btn-mini" onClick={() => setLayerEditing((v) => !v)}>
              {layerEditing ? "Fermer" : "Layer-ID"}
            </button>
            {layerEditing && (
              <div className="auc-layer-edit">
                <input
                  type="text"
                  value={layerInput}
                  onChange={(e) => setLayerInput(e.target.value)}
                  placeholder="Layer-XXXXXX"
                />
                <button
                  className="btn-mini"
                  onClick={() => {
                    setZonageLayerId(layerInput);
                    location.reload();
                  }}
                >
                  Appliquer
                </button>
              </div>
            )}
          </>
        )}
        <label className="map-toolbar-toggle">
          <input
            type="checkbox"
            checked={planche}
            onChange={(e) => setPlanche(e.target.checked)}
          />
          <span>Planche PAU</span>
        </label>
        <label className="map-toolbar-toggle">
          <input
            type="checkbox"
            checked={drawMode}
            onChange={(e) => {
              const on = e.target.checked;
              setDrawMode(on);
              if (!on) resetDraw();
            }}
          />
          <span>📐 Mesurer</span>
        </label>
        {planche && (
          <>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={plancheOpacity}
              onChange={(e) => setPlancheOpacity(Number(e.target.value))}
              title="Opacité de la planche"
            />
            <button className="btn-mini" onClick={() => setCalibrating((c) => !c)}>
              {calibrating ? "Fermer le calage" : "Caler la planche"}
            </button>
          </>
        )}
      </div>
      {planche && calibrating && (
        <PlancheCalibration bbox={bbox} setBbox={setBbox} onClose={() => setCalibrating(false)} />
      )}
      {drawMode && (
        <div className="draw-panel">
          <strong>Mesure du terrain</strong>
          <div className="draw-help">
            {drawFinalized
              ? "Polygone fermé."
              : drawPoints.length === 0
                ? "Cliquez sur la carte pour poser le 1er sommet."
                : `${drawPoints.length} sommet${drawPoints.length > 1 ? "s" : ""} · double-clic ou Entrée pour fermer.`}
          </div>
          {drawArea != null && (
            <div className="draw-area">
              {Math.round(drawArea).toLocaleString("fr-FR")} m²
            </div>
          )}
          <div className="draw-actions">
            {drawPoints.length > 0 && !drawFinalized && drawPoints.length >= 3 && (
              <button className="btn-mini" onClick={() => setDrawFinalized(true)}>
                Terminer
              </button>
            )}
            {drawPoints.length > 0 && (
              <button className="btn-mini" onClick={resetDraw}>
                Effacer
              </button>
            )}
            {drawFinalized && drawArea != null && (
              <button className="btn-mini btn-primary" onClick={useDrawAsParcel}>
                ▶ Simuler
              </button>
            )}
          </div>
        </div>
      )}
      {error && <div className="map-error">⚠ {error}</div>}
    </>
  );
}
