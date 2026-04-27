import { useEffect, useRef, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("init");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    console.log("[MapView] mounting, container size:",
      containerRef.current.clientWidth, "x", containerRef.current.clientHeight);
    console.log("[MapView] webgl supported:",
      !!document.createElement("canvas").getContext("webgl2") ||
      !!document.createElement("canvas").getContext("webgl"));

    let map: MlMap;
    try {
      map = new maplibregl.Map({
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
      setStatus("constructed");
      console.log("[MapView] map constructed");
    } catch (e) {
      console.error("[MapView] constructor threw", e);
      setError(String(e));
      return;
    }

    map.on("error", (e) => {
      console.error("[MapView] map error event", e);
      setError(e.error?.message ?? String(e));
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", async () => {
      console.log("[MapView] style loaded");
      setStatus("loaded");
      try {
        const data = await fetch(parcelles).then((r) => r.json());
        map.addSource("parcelles", { type: "geojson", data });

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
        setStatus("ready");
      } catch (e) {
        console.error("[MapView] failed to load parcels", e);
        setError(String(e));
      }
    });

    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
    };
  }, [onParcelSelect]);

  return (
    <>
      <div ref={containerRef} className="map" />
      <div className="map-status">
        {error ? `⚠ ${error}` : status === "ready" ? "" : `Carte : ${status}…`}
      </div>
    </>
  );
}
