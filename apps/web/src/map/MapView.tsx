import { useEffect, useRef } from "react";
import maplibregl, { Map as MlMap } from "maplibre-gl";
import parcelles from "../../../../data/ainchock/parcelles.geojson?url";

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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [-7.5559, 33.5487],
      zoom: 16,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", async () => {
      const data = await fetch(parcelles).then((r) => r.json());
      map.addSource("parcelles", { type: "geojson", data });

      const matchExpr: maplibregl.ExpressionSpecification = [
        "match",
        ["get", "zone"],
        "SD1",
        ZONE_COLORS.SD1!,
        "SD2",
        ZONE_COLORS.SD2!,
        "ZH",
        ZONE_COLORS.ZH!,
        "ZE",
        ZONE_COLORS.ZE!,
        "ZI",
        ZONE_COLORS.ZI!,
        "#888",
      ];
      map.addLayer({
        id: "parcelles-fill",
        type: "fill",
        source: "parcelles",
        paint: {
          "fill-color": matchExpr,
          "fill-opacity": 0.45,
        },
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
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onParcelSelect]);

  return <div ref={containerRef} className="map" />;
}
