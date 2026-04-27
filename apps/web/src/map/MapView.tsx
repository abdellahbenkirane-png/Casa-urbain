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

const ZONE_COLORS: Record<string, string> = {
  SD1: "#2f81f7",
  SD2: "#58a6ff",
  ZH: "#3fb950",
  ZE: "#f0883e",
  ZI: "#a371f7",
};

export function MapView({ onParcelSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    map.on("load", () => {
      try {
        map.addSource("parcelles", { type: "geojson", data: PARCELLES_DATA });

        const bounds = new maplibregl.LngLatBounds();
        for (const f of PARCELLES_DATA.features) {
          const g = f.geometry as GeoJSON.Polygon | undefined;
          const coords = g?.coordinates?.[0];
          if (Array.isArray(coords)) {
            for (const [lng, lat] of coords) bounds.extend([lng, lat]);
          }
        }
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 80, maxZoom: 17, duration: 0 });
        }

        const matchExpr: maplibregl.ExpressionSpecification = [
          "match",
          ["get", "zone"],
          "SD1", ZONE_COLORS.SD1!,
          "SD2", ZONE_COLORS.SD2!,
          "ZH", ZONE_COLORS.ZH!,
          "ZE", ZONE_COLORS.ZE!,
          "ZI", ZONE_COLORS.ZI!,
          "#888",
        ];
        map.addLayer({
          id: "parcelles-fill",
          type: "fill",
          source: "parcelles",
          paint: { "fill-color": matchExpr, "fill-opacity": 0.45 },
        });
        map.addLayer({
          id: "parcelles-outline",
          type: "line",
          source: "parcelles",
          paint: { "line-color": "#fff", "line-width": 1.5 },
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

  return (
    <>
      <div ref={containerRef} className="map" />
      {error && <div className="map-error">⚠ {error}</div>}
    </>
  );
}
