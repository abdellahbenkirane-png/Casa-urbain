import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MlMap } from "maplibre-gl";
import parcellesRaw from "../../../../data/ainchock/parcelles.geojson?raw";

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
// On extrait la lettre initiale du code (ex. "B5" → "B", "PB" → "PB", "I3" → "I").
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

interface BBox { W: number; E: number; S: number; N: number }

const DEFAULT_BBOX: BBox = { W: -7.673, E: -7.566, S: 33.4685, N: 33.5843 };

function PlancheCalibration({
  bbox,
  setBbox,
  onClose,
}: {
  bbox: BBox;
  setBbox: (b: BBox) => void;
  onClose: () => void;
}) {
  const NUDGE_LNG = 0.0005; // ≈ 50 m E/O à cette latitude
  const NUDGE_LAT = 0.0005; // ≈ 55 m N/S
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
  // 4 coins du calage : west, east, south, north (lng, lng, lat, lat)
  const [bbox, setBbox] = useState<{ W: number; E: number; S: number; N: number }>(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("planche-bbox") : null;
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallthrough
      }
    }
    return { W: -7.673, E: -7.566, S: 33.4685, N: 33.5843 };
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
          },
          layers: [{ id: "base", type: "raster", source: "base" }],
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

    map.on("load", async () => {
      try {
        // 0. Planche PAU d'Aïn Chock — overlay raster (cadrage ajustable, coins persistés)
        map.addSource("planche", {
          type: "image",
          url: "/data/ainchock/pau-planche.jpg",
          coordinates: [
            [bbox.W, bbox.N], // top-left
            [bbox.E, bbox.N], // top-right
            [bbox.E, bbox.S], // bottom-right
            [bbox.W, bbox.S], // bottom-left
          ],
        });
        map.addLayer({
          id: "planche-layer",
          type: "raster",
          source: "planche",
          paint: { "raster-opacity": 0, "raster-fade-duration": 0 },
        });

        // 1. Périmètre administratif d'Aïn Chock (OSM)
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
            const bounds = new maplibregl.LngLatBounds();
            for (const f of perim.features ?? []) {
              const geom = f.geometry;
              const polys =
                geom.type === "Polygon"
                  ? [geom.coordinates]
                  : geom.type === "MultiPolygon"
                    ? geom.coordinates
                    : [];
              for (const poly of polys)
                for (const ring of poly) for (const [lng, lat] of ring) bounds.extend([lng, lat]);
            }
            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, { padding: 30, duration: 0 });
            }
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

        // 3. Parcelles de démo (cliquables, par-dessus tout le reste)
        map.addSource("parcelles", { type: "geojson", data: PARCELLES_DATA });

        // famille = ["case", [== zone "PB"], "PB", [== zone "PU"], "PU", [slice zone 0 1]]
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

        map.on("click", "parcelles-fill", (e) => {
          const feature = e.features?.[0];
          if (!feature) return;
          onParcelSelect(feature.properties as ParcelleProperties);
        });
        map.on("mouseenter", "parcelles-fill", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "parcelles-fill", () => {
          map.getCanvas().style.cursor = "";
        });
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

  // Synchronise l'opacité du calque planche avec l'état React
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("planche-layer")) return;
    const op = planche ? plancheOpacity : 0;
    map.setPaintProperty("planche-layer", "raster-opacity", op);
  }, [planche, plancheOpacity]);

  // Met à jour les coins de la planche + persiste
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
      // localStorage indisponible (mode privé) — ok
    }
  }, [bbox]);

  return (
    <>
      <div ref={containerRef} className="map" />
      <div className="map-toolbar">
        <label className="map-toolbar-toggle">
          <input
            type="checkbox"
            checked={planche}
            onChange={(e) => setPlanche(e.target.checked)}
          />
          <span>Planche PAU</span>
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
      {error && <div className="map-error">⚠ {error}</div>}
    </>
  );
}
