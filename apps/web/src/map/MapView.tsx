import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MlMap } from "maplibre-gl";
import parcellesRaw from "../../../../data/ainchock/parcelles.geojson?raw";
import { fetchZonage } from "./aucService";
import { SearchBar } from "./SearchBar";
import { Legend } from "./Legend";
import { AUTRE_COLOR, FAMILLE_COLORS as ZONE_COLORS } from "../zoning/zones";
import { prixTerrainOf, surfaceParDefaut } from "../simulator/zoneProfiles";

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


const ZOOM_MIN_AUC = 13;

interface BBox { W: number; E: number; S: number; N: number }

const DEFAULT_BBOX: BBox = { W: -7.673, E: -7.566, S: 33.4685, N: 33.5843 };


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
              // Esri World Street Map : sans clé API (CARTO en exige une
              // depuis 2026 et renvoie des tuiles « API KEY REQUIRED »).
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              minzoom: 0,
              maxzoom: 19,
              attribution:
                "Tiles © Esri — Source: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, METI, OpenStreetMap contributors",
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
            // Satellite par défaut (cf. useState) : pas de flash du fond Plan au chargement.
            { id: "base", type: "raster", source: "base", layout: { visibility: "none" } },
            { id: "satellite", type: "raster", source: "satellite" },
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
      // Idem quand la carte est étroite (tablette) : sinon elle couvre la légende.
      if (window.innerWidth <= 768 || (containerRef.current?.clientWidth ?? 0) < 900) {
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

        // 1. Périmètre administratif (OSM) — chargé en arrière-plan : ne bloque
        // plus la création des calques suivants (zonage, clics).
        fetch("/data/ainchock/perimetre.geojson")
          .then((r) => (r.ok ? r.json() : null))
          .then((perim) => {
            if (!perim || map.getSource("perimetre")) return;
            map.addSource("perimetre", { type: "geojson", data: perim });
            map.addLayer(
              {
                id: "perimetre-line",
                type: "line",
                source: "perimetre",
                paint: { "line-color": "#2f81f7", "line-width": 2, "line-dasharray": [3, 2] },
              },
              map.getLayer("buildings-fill") ? "buildings-fill" : undefined,
            );
          })
          .catch((e) => console.warn("[MapView] périmètre indisponible", e));

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
          AUTRE_COLOR, // familles non répertoriées (ZUG, RA, TVR…)
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
          AUTRE_COLOR,
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
        // Halo blanc + trait encre : la zone ouverte se distingue des contours
        // blancs de toutes les autres zones.
        map.addLayer({
          id: "selection-halo",
          type: "line",
          source: "selection",
          paint: { "line-color": "#ffffff", "line-width": 7, "line-opacity": 0.9 },
        });
        map.addLayer({
          id: "selection-line",
          type: "line",
          source: "selection",
          paint: { "line-color": "#121211", "line-width": 3 },
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
          // plusieurs hectares). Par défaut on part d'une parcelle type de
          // 500 m², relevée au minimum réglementaire de la zone (ex. D4 :
          // 1 000 m²), que l'utilisateur ajustera ensuite.
          const surface = surfaceParDefaut(secteur);
          const prefecture = String(a.prefecture ?? "").trim();
          const commune = String(a.commune ?? "").trim();
          onParcelSelect({
            id: `AUC-${a.aucId ?? a.id ?? "?"}`,
            adresse: `${commune || prefecture || "Casablanca"} · secteur ${secteur}`,
            zone: secteur,
            surface,
            prixTerrainMedianDhM2: prixTerrainOf(secteur),
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
    // Pas map.loaded() : il reste false tant que des tuiles chargent, et
    // « load » ne se déclenche qu'une fois → la bascule était ignorée.
    if (map.getLayer("base")) apply();
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
      } else {
        fillSrc.setData({ type: "FeatureCollection", features: [] });
      }
    };
    // L'aire ne dépend pas de la carte : calculée directement.
    setDrawArea(drawPoints.length >= 3 ? geodesicArea(drawPoints) : null);
    // Pas isStyleLoaded() : il reste false tant que des tuiles ou le zonage
    // chargent, et « load » ne se déclenche qu'une fois → rien n'était dessiné.
    if (map.getSource("draw-points")) apply();
    else map.once("load", apply);
  }, [drawPoints, drawFinalized]);

  const resetDraw = () => {
    setDrawPoints([]);
    setDrawArea(null);
    setDrawFinalized(false);
  };
  const useDrawAsParcel = () => {
    if (!drawArea) return;
    // Zone = celle sous le centre du terrain dessiné (zonage AUC, sinon
    // parcelles de démo). Avant, on supposait A6 partout, ce qui appliquait
    // le règlement d'Aïn Chock à n'importe quel terrain.
    const map = mapRef.current;
    let zone = "?";
    let prefecture: string | undefined;
    let commune = "";
    if (map && drawPoints.length > 0) {
      const lng = drawPoints.reduce((a, p) => a + p[0], 0) / drawPoints.length;
      const lat = drawPoints.reduce((a, p) => a + p[1], 0) / drawPoints.length;
      const layers = ["parcelles-fill", "auc-zonage-fill"].filter(
        (l) => map.getLayer(l) && map.getLayoutProperty(l, "visibility") !== "none",
      );
      const hit = map.queryRenderedFeatures(map.project([lng, lat]), { layers })[0];
      const a = (hit?.properties ?? {}) as Record<string, unknown>;
      const code = String(a.secteur ?? a.zone ?? "").trim();
      if (code) zone = code;
      prefecture = String(a.prefecture ?? "").trim() || undefined;
      commune = String(a.commune ?? "").trim();
    }
    onParcelSelect({
      id: `MESURE-${Date.now().toString(36)}`,
      adresse: commune ? `Terrain dessiné · ${commune}` : "Terrain dessiné à la main",
      zone,
      surface: Math.round(drawArea),
      prixTerrainMedianDhM2: prixTerrainOf(zone),
      prefecture,
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
  // Stratégie :
  //   1. rien sous le zoom 13 (la ville entière = des milliers de polygones,
  //      que le serveur AUC refuse de toute façon) ;
  //   2. la ville est découpée en carrés fixes (CELL_DEG) : chaque carré est
  //      toujours la même requête → mise en cache par le CDN Vercel et le
  //      service worker, réutilisable d'un visiteur à l'autre ;
  //   3. carrés chargés en parallèle, affichés au fil de l'eau ;
  //   4. debounce 200 ms sur moveend.
  const DEBOUNCE_MS = 200;
  // ≈ 2,8 × 3,3 km. Au-delà de ~0,05° le serveur AUC devient lent et
  // instable (timeouts, voire toute la ville renvoyée) ; en dessous il répond
  // en < 1 s.
  const CELL_DEG = 0.03;
  const MAX_PARALLEL = 6;
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !aucZonage) return;
    let cancelled = false;
    const abort = new AbortController();
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();
    let debounceId: ReturnType<typeof setTimeout> | null = null;
    // Carrés chargés (clé "i,j" → features) et en cours de chargement.
    const cells = new Map<string, GeoJSON.Feature[]>();
    const inFlight = new Set<string>();
    let failed = false;

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

    // Fusionne les carrés en dédoublonnant les zones à cheval sur 2 carrés.
    const publish = () => {
      const seen = new Set<unknown>();
      const features: GeoJSON.Feature[] = [];
      for (const list of cells.values()) {
        for (const f of list) {
          const id = f.properties?.aucId;
          if (id != null && id !== 0) {
            if (seen.has(id)) continue;
            seen.add(id);
          }
          features.push(f);
        }
      }
      setSourceData({ type: "FeatureCollection", features });
      setAucCount(features.length);
    };

    const syncStatus = () => {
      if (cancelled) return;
      setAucStatus(inFlight.size > 0 ? "loading" : failed && cells.size === 0 ? "error" : "ok");
    };

    // Arrondi pour que la même cellule produise toujours la même URL (cache).
    const edge = (k: number) => Number((k * CELL_DEG).toFixed(4));

    const loadCell = async (i: number, j: number) => {
      const key = `${i},${j}`;
      inFlight.add(key);
      syncStatus();
      const bbox = { W: edge(i), E: edge(i + 1), S: edge(j), N: edge(j + 1) };
      try {
        // Le serveur AUC échoue parfois de façon transitoire : 1 nouvel essai.
        const fc = await fetchZonage(bbox, abort.signal).catch((e) => {
          if ((e as Error).name === "AbortError") throw e;
          return fetchZonage(bbox, abort.signal);
        });
        if (cancelled) return;
        cells.set(key, fc.features);
        publish();
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        console.warn("[MapView] AUC zonage fetch failed", key, e);
        failed = true;
      } finally {
        inFlight.delete(key);
        syncStatus();
      }
    };

    const doFetch = async () => {
      if (cancelled) return;
      if (map.getZoom() < ZOOM_MIN_AUC) {
        setAucStatus("idle");
        return;
      }
      const b = map.getBounds();
      // Carrés visibles, centre d'abord : la zone regardée apparaît en premier.
      const i0 = Math.floor(b.getWest() / CELL_DEG);
      const i1 = Math.floor(b.getEast() / CELL_DEG);
      const j0 = Math.floor(b.getSouth() / CELL_DEG);
      const j1 = Math.floor(b.getNorth() / CELL_DEG);
      const ci = (i0 + i1) / 2;
      const cj = (j0 + j1) / 2;
      const todo: [number, number][] = [];
      for (let i = i0; i <= i1; i++)
        for (let j = j0; j <= j1; j++)
          if (!cells.has(`${i},${j}`) && !inFlight.has(`${i},${j}`)) todo.push([i, j]);
      todo.sort((a, c) => Math.hypot(a[0] - ci, a[1] - cj) - Math.hypot(c[0] - ci, c[1] - cj));
      if (todo.length === 0) {
        syncStatus();
        return;
      }
      failed = false;
      // File d'attente à MAX_PARALLEL requêtes simultanées.
      let next = 0;
      const worker = async () => {
        while (!cancelled && next < todo.length) {
          const [i, j] = todo[next++]!;
          await loadCell(i, j);
        }
      };
      await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL, todo.length) }, worker));
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
      abort.abort();
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
          <svg className="brand-mark" width="22" height="22" viewBox="0 0 22 22" aria-hidden>
            {/* Plan de zonage stylisé : une parcelle pleine dans une trame. */}
            <rect x="1" y="1" width="20" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M11 1v20M1 11h20" stroke="currentColor" strokeWidth="1.6" />
            <rect x="11" y="11" width="10" height="10" rx="0" fill="currentColor" />
          </svg>
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
        aria-label={drawMode ? "Annuler la mesure" : "Dessiner un terrain"}
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

      {aucZonage && !zoomTooLow && aucStatus === "loading" && !drawMode && (
        <div className="map-status" role="status">
          <span className="spinner" aria-hidden /> Chargement du zonage…
        </div>
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
