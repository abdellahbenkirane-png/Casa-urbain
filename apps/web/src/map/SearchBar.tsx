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
  // Vrai après une réponse de Nominatim pour le texte courant (message « aucun résultat »).
  const [searched, setSearched] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  // Le libellé écrit dans le champ après une sélection ne doit pas relancer
  // une recherche (sinon la liste se rouvre par-dessus la carte).
  const skipSearchRef = useRef(false);

  // Ferme le dropdown si on clique en dehors
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearched(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Recherche Nominatim avec debounce 300 ms
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    setSearched(false);
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
        setSearched(true);
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
    skipSearchRef.current = true;
    setQ(r.display_name.split(",")[0] ?? r.display_name);
    setOpen(false);
    setResults([]);
    setSearched(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") setSearched(false);
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
      setSearched(false);
    }
  };

  return (
    <div className="search" ref={wrapperRef}>
      <div className="search-input-wrapper">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          placeholder="Rechercher une adresse, un quartier…"
          aria-label="Rechercher une adresse"
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
              setSearched(false);
            }}
            aria-label="Effacer"
          >
            ✕
          </button>
        )}
        {loading && <span className="spinner" aria-label="Recherche…" />}
      </div>
      {searched && !loading && results.length === 0 && q.trim().length >= 3 && (
        <div className="search-empty" role="status">
          Aucun résultat à Casablanca pour « {q.trim()} ». Essayez un nom de rue ou de quartier.
        </div>
      )}
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
