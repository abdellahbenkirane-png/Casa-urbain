import { useEffect, useRef, useState } from "react";
import type { Map as MlMap } from "maplibre-gl";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  boundingbox?: [string, string, string, string];
}

interface Props {
  /**
   * Réf vers la map MapLibre. Utilisée pour faire flyTo sur le résultat
   * sélectionné. Passée via mapRef.current pour partager la même instance
   * que MapView.
   */
  getMap: () => MlMap | null;
}

// BBox Casablanca large (de Mohammedia à Bouskoura), utilisée pour biaiser
// la recherche Nominatim et exclure les résultats hors-ville.
const CASA_VIEWBOX = "-7.78,33.65,-7.40,33.45"; // left,top,right,bottom

export function SearchBar({ getMap }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Ferme le dropdown si on clique en dehors
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Recherche Nominatim avec debounce 300 ms
  useEffect(() => {
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          "https://nominatim.openstreetmap.org/search?" +
          new URLSearchParams({
            q: q.trim(),
            format: "json",
            countrycodes: "ma",
            limit: "8",
            addressdetails: "1",
            viewbox: CASA_VIEWBOX,
            bounded: "1",
          });
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as NominatimResult[];
        setResults(data);
        setOpen(data.length > 0);
        setActiveIdx(-1);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.warn("[SearchBar] Nominatim failed", e);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  const select = (r: NominatimResult) => {
    const map = getMap();
    if (!map) return;
    const lng = parseFloat(r.lon);
    const lat = parseFloat(r.lat);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      map.flyTo({ center: [lng, lat], zoom: 17, duration: 900 });
    }
    setQ(r.display_name.split(",")[0] ?? r.display_name);
    setOpen(false);
    setResults([]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = activeIdx >= 0 ? activeIdx : 0;
      const r = results[idx];
      if (r) select(r);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="search" ref={wrapperRef}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="search"
          placeholder="Adresse, quartier, boulevard…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {q && (
          <button
            type="button"
            className="search-clear"
            onClick={() => {
              setQ("");
              setResults([]);
              setOpen(false);
            }}
            aria-label="Effacer"
          >
            ✕
          </button>
        )}
        {loading && <span className="search-spinner">⏳</span>}
      </div>
      {open && results.length > 0 && (
        <ul className="search-results">
          {results.map((r, i) => (
            <li
              key={`${r.lat}-${r.lon}-${i}`}
              className={i === activeIdx ? "active" : ""}
              onMouseDown={(e) => {
                e.preventDefault();
                select(r);
              }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <strong>{r.display_name.split(",")[0]}</strong>
              <span>{r.display_name.split(",").slice(1, 4).join(",")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
