import type { SimulationOutput, AdvancedMetrics } from "@casa/core";
import { fmtDh, fmtDhShort, fmtDhSigned, fmtPct, fmtPctSigned } from "./format";

type Level = "good" | "low" | "bad";

const verdictOf = (marge: number, resultat: number): { level: Level; label: string } => {
  if (resultat <= 0) return { level: "bad", label: "Projet non rentable" };
  if (marge < 0.15) return { level: "low", label: "Rentabilité faible" };
  return { level: "good", label: "Projet rentable" };
};

/** Carte « verdict » : ce que tout le monde lit en premier. */
export function Verdict({ result }: { result: SimulationOutput }) {
  const t = result.totaux;
  const v = verdictOf(t.margeNette, t.resultatNet);
  const ventes = Math.max(t.totalVentes, 1);
  // Les charges sont stockées en négatif par le moteur.
  const couts = Math.abs(t.totalCharges);
  const chargesPct = Math.min(100, (couts / ventes) * 100);

  return (
    <section className={`verdict ${v.level}`}>
      <div className="verdict-label">
        <span className="dot" aria-hidden />
        {v.label}
      </div>
      <div className="verdict-figures">
        <div>
          <span className="verdict-caption">Bénéfice net estimé</span>
          <span className="verdict-big">{fmtDhShort(t.resultatNet)}</span>
        </div>
        <div className="verdict-side">
          <span className="verdict-caption">Marge nette</span>
          <span className="verdict-mid">{fmtPct(t.margeNette)}</span>
        </div>
      </div>
      <div className="bar" aria-hidden>
        <span className="bar-costs" style={{ width: `${chargesPct}%` }} />
      </div>
      <div className="bar-legend">
        <span><i className="sw costs" /> Coûts {fmtDhShort(couts)}</span>
        <span><i className="sw sales" /> Ventes {fmtDhShort(t.totalVentes)}</span>
      </div>
    </section>
  );
}

const KPIS: {
  key: string;
  label: string;
  help: string;
  get: (r: SimulationOutput, a: AdvancedMetrics) => string;
}[] = [
  { key: "ca", label: "Chiffre d'affaires HT", help: "Total des ventes hors taxes.", get: (r) => fmtDh(r.totaux.totalVentes) },
  { key: "charges", label: "Coûts totaux", help: "Terrain, autorisations, construction, financement et frais de vente.", get: (r) => fmtDh(Math.abs(r.totaux.totalCharges)) },
  { key: "ebit", label: "Résultat avant impôt", help: "EBIT : ventes moins coûts, avant impôt sur les sociétés.", get: (r) => fmtDh(r.totaux.ebit) },
  { key: "tri", label: "Rendement annuel (TRI)", help: "Taux de rentabilité interne : rendement annuel moyen de l'argent investi.", get: (_, a) => (a.tri == null ? "—" : fmtPct(a.tri)) },
  { key: "roe", label: "Rentabilité des fonds propres", help: "ROE : bénéfice net rapporté aux fonds propres engagés sur le projet.", get: (r) => fmtPct(r.totaux.roe) },
  { key: "coc", label: "Cash-on-cash / an", help: "Bénéfice annuel rapporté à l'apport en cash.", get: (_, a) => fmtPct(a.cashOnCash) },
  { key: "pm", label: "Prix de vente minimum", help: "Point mort : prix au m² des appartements en dessous duquel le projet perd de l'argent.", get: (_, a) => (a.pointMortPrixApparts == null ? "—" : `${fmtDh(a.pointMortPrixApparts)}/m²`) },
];

/** Indicateurs détaillés pour les professionnels. */
export function Metrics({ result, advanced }: { result: SimulationOutput; advanced: AdvancedMetrics }) {
  return (
    <dl className="metrics">
      {KPIS.map((k) => (
        <div key={k.key} title={k.help}>
          <dt>
            {k.label}
            <span className="help" aria-label={k.help}>?</span>
          </dt>
          <dd>{k.get(result, advanced)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CostBreakdown({ result }: { result: SimulationOutput }) {
  const raw: [string, number][] = [
    ["Acquisition du terrain", result.acquisition.total],
    ["Études et autorisations", result.autorisations.total],
    ["Construction", result.constructions.total],
    ["Frais financiers", result.chargesFinancieres.total],
    ["Frais de vente", result.chargesVente.total],
    ["Impôt sur les sociétés", result.totaux.is],
  ];
  const rows = raw.map(([l, v]): [string, number] => [l, Math.abs(v)]);
  const max = Math.max(...rows.map(([, v]) => v), 1);
  return (
    <table className="data-table">
      <tbody>
        {rows.map(([label, v]) => (
          <tr key={label}>
            <td>
              {label}
              <span className="inline-bar" style={{ width: `${(v / max) * 100}%` }} />
            </td>
            <td>{fmtDh(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Sensitivity({ advanced }: { advanced: AdvancedMetrics }) {
  return (
    <>
      <p className="section-help">Effet d'une variation de chaque paramètre sur le bénéfice net.</p>
      <table className="data-table">
        <thead>
          <tr>
            <th>Si…</th>
            <th>varie de</th>
            <th>Bénéfice</th>
            <th>Marge</th>
          </tr>
        </thead>
        <tbody>
          {advanced.sensibilite.map((s, i) => (
            <tr key={i}>
              <td>{s.parametre}</td>
              <td>{fmtPctSigned(s.variation, 0)}</td>
              <td className={s.delta < 0 ? "neg" : "pos"}>{fmtDhSigned(s.delta)}</td>
              <td>{fmtPct(s.margeNette)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
