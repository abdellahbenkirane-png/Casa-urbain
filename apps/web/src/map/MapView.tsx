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
  const [aucZonage, setAucZonage] = useState(false);
  const [aucStatus, setAucStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [aucCount, setAucCount] = useState(0);
  const [layerInput, setLayerInput] = useState(AUC_LAYERS.zonage);
  const [layerEditing, setLayerEditing] = useState(false);
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

        // Couleur par famille de zone via expression "case + match" sur les
        // 1-2 premiers caractères de l'attribut `secteur`. Coalesce avec ""
        // pour ne pas crasher sur les features dont secteur est null.
        const secteurExpr: maplibregl.ExpressionSpecification = [
          "coalesce",
          ["get", "secteur"],
          "",
        ];
        const aucColorExpr: maplibregl.ExpressionSpecification = [
          "case",
          ["==", ["slice", secteurExpr, 0, 2], "PB"], ZONE_COLORS.PB!,
          ["==", ["slice", secteurExpr, 0, 2], "PU"], ZONE_COLORS.PU!,
          ["==", ["slice", secteurExpr, 0, 2], "ZR"], ZONE_COLORS.ZR!,
          [
            "match",
            ["slice", secteurExpr, 0, 1],
            "A", ZONE_COLORS.A!,
            "B", ZONE_COLORS.B!,
            "C", ZONE_COLORS.C!,
            "D", ZONE_COLORS.D!,
            "E", ZONE_COLORS.E!,
            "I", ZONE_COLORS.I!,
            "S", ZONE_COLORS.S!,
            "#e74c3c", // rouge — fallback debug pour repérer les secteurs non couverts
          ],
        ];
        // Mode debug : couleur fixe pour vérifier que la layer rend les polygones.
        // Une fois visible, on remplacera par aucColorExpr.
        void aucColorExpr;
        map.addLayer({
          id: "auc-zonage-fill",
          type: "fill",
          source: "auc-zonage",
          paint: { "fill-color": "#e74c3c", "fill-opacity": 0.5 },
        });
        map.addLayer({
          id: "auc-zonage-outline",
          type: "line",
          source: "auc-zonage",
          paint: { "line-color": "#000", "line-width": 1.5 },
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

  // Toggle "Zonage AUC". On retente jusqu'à ce que la layer existe.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let retries = 0;
    const apply = () => {
      if (!map.getLayer("auc-zonage-fill")) {
        if (retries++ < 50) setTimeout(apply, 100);
        return;
      }
      console.log("[MapView] toggle AUC", { aucZonage, aucCount });
      // Démos masquées dès qu'AUC est actif et a livré des features
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
      const sample =
        fc.features[0]?.geometry?.type === "Polygon"
          ? (fc.features[0].geometry as GeoJSON.Polygon).coordinates[0]?.[0]
          : null;
      console.log(
        "[MapView] AUC setData",
        fc.features.length,
        "1er secteur:",
        fc.features[0]?.properties?.secteur,
        "1er coord:",
        sample,
      );
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
      <div className="map-toolbar">
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
