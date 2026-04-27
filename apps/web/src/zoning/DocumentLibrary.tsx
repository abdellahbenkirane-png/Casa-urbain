import { useState } from "react";
import { FicheModal } from "./FicheModal";

interface DocSpec {
  id: string;
  label: string;
  emoji: string;
  description: string;
  pages: string[];
}

const range = (n: number, prefix: string, pad = 2) =>
  Array.from({ length: n }, (_, i) =>
    `/data/ainchock/reglement/${prefix}-p${String(i + 1).padStart(pad, "0")}.jpg`,
  );

const DOCS: DocSpec[] = [
  {
    id: "rg",
    label: "Règlement Général",
    emoji: "📜",
    description: "Articles 1-77 du PAU",
    pages: range(21, "rg"),
  },
  {
    id: "patrimoine",
    label: "Patrimoine bâti",
    emoji: "🏛️",
    description: "Inventaire des unités à protéger",
    pages: range(7, "patrimoine"),
  },
  {
    id: "equipements",
    label: "Équipements",
    emoji: "🏗️",
    description: "Voirie, équipements publics programmés",
    pages: range(37, "equipements"),
  },
];

export function DocumentLibrary() {
  const [active, setActive] = useState<DocSpec | null>(null);
  return (
    <>
      <div className="docs">
        <div className="docs-title">Documentation officielle PAU 2025</div>
        <div className="docs-grid">
          {DOCS.map((d) => (
            <button key={d.id} className="doc-chip" onClick={() => setActive(d)}>
              <span className="doc-emoji">{d.emoji}</span>
              <div>
                <span className="doc-label">{d.label}</span>
                <span className="doc-desc">{d.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      {active && (
        <FicheModal
          title={active.label}
          pages={active.pages}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}
