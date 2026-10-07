import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MlMap } from "maplibre-gl";
import parcellesRaw from "../../../../data/ainchock/parcelles.geojson?raw";
import { fetchZonage } from "./aucService";
import { SearchBar } from "./SearchBar";
import { Legend } from "./Legend";
import { FAMILLE_COLORS as ZONE_COLORS } from "../zoning/zones";

const PARCELLES_DATA = JSON.parse(parcellesRaw) as GeoJSON.FeatureCollection;

interface Props {
  onParcelSelect: (props: ParcelleProperties) => void;
  /** false → efface le contour de sélection (panneau fermé). */
  hasSelection: boolean;
}

export interface ParcelleProperties {
  id: string;
  adresse: string;
  zone: string;
  surface: number;
  facade1?: number;
  facade2?: number;
  prixTerrainMedianDhM2: number;
  prefecture?: string;
}

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

const ZOOM_MIN_AUC = 13;

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

function Switch({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="layer-row">
      <span className="layer-text">
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function MapView({ onParcelSelect, hasSelection }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planche, setPlanche] = useState(false);
  const [plancheOpacity, setPlancheOpacity] = useState(0.65);
  const [aucZonage, setAucZonage] = useState(true);
  const [aucStatus, setAucStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [aucCount, setAucCount] = useState(0);
  // Reste possible de surcharger le layer-id via
  // localStorage.setItem("auc-zonage-layer-id", "Layer-XXXXXX") en console,
  // utile pour debug. Pas exposé dans l'UI : le bon ID est connu.
  const [satellite, setSatellite] = useState(true);
  const [drawMode, setDrawMode] = useState(false);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);
  const [drawArea, setDrawArea] = useState<number | null>(null);
  const [drawFinalized, setDrawFinalized] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);
  // Les clics carte servent à poser des sommets en mode mesure : on ne
  // sélectionne pas de zone pendant ce temps.
  const drawModeRef = useRef(false);
  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);
  const [zoomTooLow, setZoomTooLow] = useState(true);
  const [showBuildings, setShowBuildings] = useState(false);
  const [bbox, setBbox] = useState<BBox>(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("planche-bbox") : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Validation minimale : 4 nombres finis dans des plages plausibles.
        if (
          typeof parsed?.W === "number" && typeof parsed?.E === "number" &&
          typeof parsed?.S === "number" && typeof parsed?.N === "number" &&
          [parsed.W, parsed.E, parsed.S, parsed.N].every(Number.isFinite)
        ) {
          return parsed as BBox;
        }
        console.warn("[MapView] planche-bbox invalide en localStorage — fallback default");
      } catch (e) {
        console.warn("[MapView] planche-bbox JSON corrompu — fallback default", e);
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
              minzoom: 0,
              maxzoom: 19,
              attribution: "© OpenStreetMap contributors © CARTO",
            },
            satellite: {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              minzoom: 0,
              // Esri World Imagery couvre Casablanca jusqu'à z=19. Au-delà
              // MapLibre upscale automatiquement la tuile z=19 (donc image
              // pixellisée mais visible) au lieu d'essayer de fetcher des
              // tuiles inexistantes (404 → écran blanc).
              maxzoom: 19,
              attribution:
                "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, GIS User Community",
            },
          },
          layers: [
            { id: "base", type: "raster", source: "base" },
            { id: "satellite", type: "raster", source: "satellite", layout: { visibility: "none" } },
          ],
        },
        // Casablanca centre — zoom assez large pour couvrir l'ensemble
        // des arrondissements (Anfa, Aïn Chock, Ben M'Sick, Hay Hassani,
        // Sidi Bernoussi, Aïn Sebaâ-Hay Mohammadi, Mers Sultan, Moulay
        // Rachid, Casa-Anfa). L'utilisateur navigue librement à partir de là.
        center: [-7.6, 33.575],
        zoom: 12,
        // Cap au niveau où les tuiles Esri / CARTO sont encore servies.
        // Au-delà l'image disparaîtrait ; on bloque plutôt que d'afficher
        // une tuile pixellisée.
        maxZoom: 19,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      // Accès console en dev uniquement (debug / tests manuels).
      if (import.meta.env.DEV) (window as unknown as { __map: MlMap }).__map = map;
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

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false, showZoom: true }),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showAccuracyCircle: true,
        showUserLocation: true,
      }),
      "bottom-right",
    );

    map.on("load", async () => {
      // Sur mobile, l'attribution reste repliée derrière le bouton ⓘ
      // (MapLibre la déplie au chargement, ce qui masque la légende).
      if (window.innerWidth <= 768) {
        containerRef.current
          ?.querySelector(".maplibregl-ctrl-attrib")
          ?.classList.remove("maplibregl-compact-show");
      }
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

        // 2. Bâtiments OSM — source vide à l'init, données chargées
        // paresseusement depuis un useEffect quand l'utilisateur active
        // le toggle "Bâtiments". Économise 3,4 MB sur le 1er chargement.
        map.addSource("buildings", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "buildings-fill",
          type: "fill",
          source: "buildings",
          paint: { "fill-color": "#8b949e", "fill-opacity": 0 },
        });
        map.addLayer({
          id: "buildings-outline",
          type: "line",
          source: "buildings",
          paint: { "line-color": "#30363d", "line-width": 0.5, "line-opacity": 0 },
        });

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
          paint: { "line-color": "#ffffff", "line-width": 1, "line-opacity": 0 },
        });

        // 4. Parcelles de démo (fallback quand AUC désactivé)
        // Pas de fitBounds : on conserve la vue Casablanca par défaut pour
        // permettre la navigation libre entre arrondissements.
        map.addSource("parcelles", { type: "geojson", data: PARCELLES_DATA });

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

        // Contour de la zone sélectionnée
        map.addSource("selection", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "selection-line",
          type: "line",
          source: "selection",
          paint: { "line-color": "#ffffff", "line-width": 3 },
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
        const highlight = (feature: maplibregl.MapGeoJSONFeature) => {
          const src = map.getSource("selection") as maplibregl.GeoJSONSource | undefined;
          src?.setData({ type: "Feature", properties: {}, geometry: feature.geometry });
        };
        map.on("click", "parcelles-fill", (e) => {
          const feature = e.features?.[0];
          if (!feature || drawModeRef.current) return;
          highlight(feature);
          onParcelSelect(feature.properties as ParcelleProperties);
        });
        map.on("click", "auc-zonage-fill", (e) => {
          const feature = e.features?.[0];
          if (!feature || drawModeRef.current) return;
          // Les parcelles de démo sont au-dessus : elles gardent la priorité.
          if (map.queryRenderedFeatures(e.point, { layers: ["parcelles-fill"] }).length > 0) return;
          highlight(feature);
          const a = feature.properties as Record<string, unknown>;
          const secteur = String(a.secteur ?? "").trim();
          if (!secteur) return;
          // L'attribut `area` est la surface du polygone de zone (souvent
          // plusieurs hectares). Sur défaut on part d'une parcelle type
          // 500 m² que l'utilisateur ajustera ensuite dans le formulaire.
          const surface = 500;
          const famille = familleOfSecteur(secteur);
          const prefecture = String(a.prefecture ?? "").trim();
          const commune = String(a.commune ?? "").trim();
          onParcelSelect({
            id: `AUC-${a.aucId ?? a.id ?? "?"}`,
            adresse: `${commune || prefecture || "Casablanca"} · secteur ${secteur}`,
            zone: secteur,
            surface,
            prixTerrainMedianDhM2: PRIX_PAR_FAMILLE[famille] ?? 15000,
            prefecture: prefecture || undefined,
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

        const syncZoom = () => setZoomTooLow(map.getZoom() < ZOOM_MIN_AUC);
        syncZoom();
        map.on("zoomend", syncZoom);
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

  useEffect(() => {
    if (hasSelection) return;
    const src = mapRef.current?.getSource("selection") as maplibregl.GeoJSONSource | undefined;
    src?.setData({ type: "FeatureCollection", features: [] });
  }, [hasSelection]);

  // Opacité planche
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("planche-layer")) return;
    map.setPaintProperty("planche-layer", "raster-opacity", planche ? plancheOpacity : 0);
  }, [planche, plancheOpacity]);

  // Toggle bâtiments OSM : fetch paresseux + opacités.
  // L'état "déjà téléchargé" est suivi via un ref plutôt que les internals
  // MapLibre — robuste aux mises à jour de la lib.
  const buildingsLoadedRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

    const apply = async () => {
      if (cancelled) return;
      if (!map.getLayer("buildings-fill")) {
        const t = setTimeout(() => {
          pendingTimers.delete(t);
          apply();
        }, 100);
        pendingTimers.add(t);
        return;
      }
      if (!showBuildings) {
        map.setPaintProperty("buildings-fill", "fill-opacity", 0);
        map.setPaintProperty("buildings-outline", "line-opacity", 0);
        return;
      }
      if (!buildingsLoadedRef.current) {
        try {
          const fc = await fetch("/data/ainchock/buildings.geojson").then((r) =>
            r.ok ? r.json() : null,
          );
          if (cancelled) return;
          const src = map.getSource("buildings") as maplibregl.GeoJSONSource | undefined;
          if (fc && src) {
            src.setData(fc);
            buildingsLoadedRef.current = true;
          }
        } catch (e) {
          console.warn("[MapView] bâtiments indisponibles", e);
          return;
        }
      }
      map.setPaintProperty("buildings-fill", "fill-opacity", 0.35);
      map.setPaintProperty("buildings-outline", "line-opacity", 1);
    };
    apply();
    return () => {
      cancelled = true;
      for (const t of pendingTimers) clearTimeout(t);
      pendingTimers.clear();
    };
  }, [showBuildings]);

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
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    const apply = () => {
      if (cancelled) return;
      if (!map.getLayer("auc-zonage-fill")) {
        if (retries++ < 50) timerId = setTimeout(apply, 100);
        return;
      }
      map.setPaintProperty("auc-zonage-fill", "fill-opacity", aucZonage ? 0.38 : 0);
      map.setPaintProperty("auc-zonage-outline", "line-opacity", aucZonage ? 0.9 : 0);
      // visibility (et non opacité) : un calque masqué ne doit plus capter les clics.
      map.setLayoutProperty("auc-zonage-fill", "visibility", aucZonage ? "visible" : "none");
      if (map.getLayer("parcelles-fill")) {
        const hide = aucZonage && aucCount > 0;
        map.setLayoutProperty("parcelles-fill", "visibility", hide ? "none" : "visible");
        map.setLayoutProperty("parcelles-outline", "visibility", hide ? "none" : "visible");
      }
    };
    apply();
    return () => {
      cancelled = true;
      if (timerId !== null) clearTimeout(timerId);
    };
  }, [aucZonage, aucCount]);

  // Récupération des features AUC quand zonage actif et que la carte bouge.
  // Stratégie pour éviter les fetchs inutiles :
  //   1. skip total si zoom < 13 (à zoom Casablanca-entière l'API renverrait
  //      des milliers de polygones)
  //   2. on fetche un bbox 50 % plus grand que le visible (tampon) ; tant
  //      que le visible est dans ce tampon, aucun nouveau fetch
  //   3. debounce 200 ms sur moveend pour éviter une rafale de requêtes
  //      durant un pan rapide
  const DEBOUNCE_MS = 200;
  const BUFFER_FACTOR = 0.5; // étend chaque côté de 50 %
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !aucZonage) return;
    let abort: AbortController | null = null;
    let cancelled = false;
    let loaded: { W: number; E: number; S: number; N: number } | null = null;
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();
    let debounceId: ReturnType<typeof setTimeout> | null = null;

    const setSourceData = (fc: GeoJSON.FeatureCollection, retries = 0) => {
      if (cancelled) return;
      const src = map.getSource("auc-zonage") as maplibregl.GeoJSONSource | undefined;
      if (!src) {
        if (retries < 50) {
          const t = setTimeout(() => {
            pendingTimers.delete(t);
            setSourceData(fc, retries + 1);
          }, 100);
          pendingTimers.add(t);
          return;
        }
        console.warn("[MapView] AUC source jamais créée — abandon");
        return;
      }
      src.setData(fc);
    };

    const contains = (
      outer: { W: number; E: number; S: number; N: number },
      inner: { W: number; E: number; S: number; N: number },
    ) =>
      outer.W <= inner.W &&
      outer.E >= inner.E &&
      outer.S <= inner.S &&
      outer.N >= inner.N;

    const doFetch = async () => {
      if (cancelled) return;
      if (map.getZoom() < ZOOM_MIN_AUC) {
        setAucStatus("idle");
        setAucCount(0);
        loaded = null;
        const src = map.getSource("auc-zonage") as maplibregl.GeoJSONSource | undefined;
        if (src) src.setData({ type: "FeatureCollection", features: [] });
        return;
      }
      const b = map.getBounds();
      const visible = {
        W: b.getWest(),
        E: b.getEast(),
        S: b.getSouth(),
        N: b.getNorth(),
      };

      // Si la zone visible est déjà incluse dans ce qui est chargé, on
      // n'envoie aucune nouvelle requête.
      if (loaded && contains(loaded, visible)) {
        return;
      }

      // Sinon on fetche un bbox étendu (1+2*buffer)× la vue actuelle.
      const dw = (visible.E - visible.W) * BUFFER_FACTOR;
      const dh = (visible.N - visible.S) * BUFFER_FACTOR;
      const buffered = {
        W: visible.W - dw,
        E: visible.E + dw,
        S: visible.S - dh,
        N: visible.N + dh,
      };

      abort?.abort();
      abort = new AbortController();
      setAucStatus("loading");
      try {
        const fc = await fetchZonage(buffered, abort.signal);
        if (cancelled) return;
        setSourceData(fc);
        setAucCount(fc.features.length);
        setAucStatus("ok");
        loaded = buffered;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        console.warn("[MapView] AUC zonage fetch failed", e);
        setAucStatus("error");
      }
    };

    const refresh = () => {
      if (debounceId !== null) clearTimeout(debounceId);
      debounceId = setTimeout(doFetch, DEBOUNCE_MS);
    };

    // 1er fetch immédiat (pas de debounce sur le 1er coup pour réactivité)
    doFetch();
    map.on("moveend", refresh);
    return () => {
      cancelled = true;
      abort?.abort();
      if (debounceId !== null) clearTimeout(debounceId);
      map.off("moveend", refresh);
      for (const t of pendingTimers) clearTimeout(t);
      pendingTimers.clear();
    };
  }, [aucZonage]);

  const aucHint =
    aucStatus === "loading"
      ? "Chargement…"
      : aucStatus === "error"
        ? "Service AUC indisponible"
        : aucStatus === "ok"
          ? `${aucCount} zones affichées`
          : "Visible à partir du zoom quartier";

  return (
    <>
      <div ref={containerRef} className="map" />

      <div className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>CU</span>
          <span className="brand-text">
            <strong>Casa Urban</strong>
            <small>Zonage &amp; rentabilité immobilière</small>
          </span>
        </div>
        <SearchBar getMap={() => mapRef.current} />
      </div>

      <div className="layers" ref={menuRef}>
        <button
          className={`map-btn ${menuOpen ? "is-active" : ""}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-label="Calques de la carte"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
            <path d="M12 3 2 8l10 5 10-5-10-5Z" />
            <path d="m2 13 10 5 10-5" />
          </svg>
          <span>Calques</span>
        </button>
        {menuOpen && (
          <div className="layers-menu" role="dialog" aria-label="Calques">
            <div className="layers-section">Fond de carte</div>
            <div className="segmented">
              <button className={!satellite ? "on" : ""} onClick={() => setSatellite(false)}>
                Plan
              </button>
              <button className={satellite ? "on" : ""} onClick={() => setSatellite(true)}>
                Satellite
              </button>
            </div>
            <div className="layers-section">Données</div>
            <Switch
              checked={aucZonage}
              onChange={setAucZonage}
              label="Zonage PAU"
              hint={aucZonage ? aucHint : "Source : Agence Urbaine de Casablanca"}
            />
            <Switch checked={showBuildings} onChange={setShowBuildings} label="Bâtiments" hint="Aïn Chock uniquement" />
            <Switch checked={planche} onChange={setPlanche} label="Planche PAU scannée" hint="Aïn Chock uniquement" />
            {planche && (
              <div className="layer-extra">
                <label className="range-row">
                  <span>Opacité</span>
                  <input
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.05}
                    value={plancheOpacity}
                    onChange={(e) => setPlancheOpacity(Number(e.target.value))}
                  />
                </label>
                <button className="btn btn-sm" onClick={() => setCalibrating((c) => !c)}>
                  {calibrating ? "Fermer le calage" : "Caler la planche"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        className={`map-btn measure-btn ${drawMode ? "is-active" : ""}`}
        onClick={() => {
          const on = !drawMode;
          setDrawMode(on);
          if (!on) resetDraw();
          setMenuOpen(false);
        }}
        aria-pressed={drawMode}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
          <path d="M3 21 21 3" />
          <path d="m7 17 2 2M11 13l2 2M15 9l2 2" />
        </svg>
        <span>{drawMode ? "Annuler la mesure" : "Dessiner un terrain"}</span>
      </button>

      {aucZonage && zoomTooLow && !drawMode && (
        <button
          className="zoom-hint"
          onClick={() => mapRef.current?.easeTo({ zoom: ZOOM_MIN_AUC + 1 })}
        >
          Zoomez pour afficher le zonage <span aria-hidden>→</span>
        </button>
      )}

      {aucZonage && !zoomTooLow && <Legend />}

      {planche && calibrating && (
        <PlancheCalibration bbox={bbox} setBbox={setBbox} onClose={() => setCalibrating(false)} />
      )}
      {drawMode && (
        <div className="draw-panel">
          <strong>Dessiner un terrain</strong>
          <div className="draw-help">
            {drawFinalized
              ? "Polygone fermé."
              : drawPoints.length === 0
                ? "Cliquez sur la carte pour placer le premier coin du terrain."
                : `${drawPoints.length} sommet${drawPoints.length > 1 ? "s" : ""} · double-clic ou Entrée pour fermer.`}
          </div>
          {drawArea != null && (
            <div className="draw-area">
              {Math.round(drawArea).toLocaleString("fr-FR")} m²
            </div>
          )}
          <div className="draw-actions">
            {drawPoints.length > 0 && !drawFinalized && drawPoints.length >= 3 && (
              <button className="btn btn-sm" onClick={() => setDrawFinalized(true)}>
                Terminer
              </button>
            )}
            {drawPoints.length > 0 && (
              <button className="btn btn-sm" onClick={resetDraw}>
                Effacer
              </button>
            )}
            {drawFinalized && drawArea != null && (
              <button className="btn btn-sm primary" onClick={useDrawAsParcel}>
                Simuler ce terrain
              </button>
            )}
          </div>
        </div>
      )}
      {error && <div className="map-error">⚠ {error}</div>}
    </>
  );
}
