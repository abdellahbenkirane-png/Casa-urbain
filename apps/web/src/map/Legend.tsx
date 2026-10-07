import { useState } from "react";
import { FAMILLE_COLORS, FAMILLE_LABELS } from "../zoning/zones";

const ORDER = ["A", "B", "C", "D", "E", "S", "I", "PU", "PB", "ZR"];

export function Legend() {
  // Repliée par défaut sur mobile pour ne pas masquer la carte.
  const [open, setOpen] = useState(() => typeof window === "undefined" || window.innerWidth > 768);

  return (
    <div className={`legend ${open ? "is-open" : ""}`}>
      <button className="legend-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="legend-swatches" aria-hidden>
          {ORDER.slice(0, 5).map((f) => (
            <i key={f} style={{ background: FAMILLE_COLORS[f] }} />
          ))}
        </span>
        Légende
        <span className="chevron" aria-hidden>{open ? "▾" : "▴"}</span>
      </button>
      {open && (
        <ul>
          {ORDER.map((f) => (
            <li key={f}>
              <i style={{ background: FAMILLE_COLORS[f] }} />
              <span>{FAMILLE_LABELS[f]!.nom}</span>
              <code>{f}</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
