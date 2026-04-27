import {
  computeAdvancedMetrics,
  simulate,
  type SimulationInput,
} from "@casa/core";

const sanitizeSheetName = (name: string) =>
  name.replace(/[\\/*?:[\]]/g, " ").slice(0, 30) || "Scénario";

export async function exportScenarioXlsx(input: SimulationInput): Promise<void> {
  // Import dynamique : ExcelJS pèse ~900 kB et n'est nécessaire qu'au clic export.
  const ExcelJS = (await import("exceljs")).default;
  const result = simulate(input);
  const adv = computeAdvancedMetrics(input, result);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Casa Urban";
  wb.created = new Date();

  const ws = wb.addWorksheet(sanitizeSheetName(input.nom));
  ws.columns = [
    { width: 38 },
    { width: 18 },
    { width: 16 },
    { width: 18 },
  ];

  const titleRow = ws.addRow([input.nom]);
  titleRow.font = { size: 14, bold: true };
  ws.addRow([]);

  ws.addRow(["I — Ventes (CA)"]).font = { bold: true };
  ws.addRow(["Libellé", "Prix TTC (DH/m²)", "Surface (m²)", "CA HT"]).font = { bold: true };
  for (const v of input.ventes) {
    const ht = v.prixTtcDhParM2 / (1 + input.hypotheses.tvaVente);
    ws.addRow([v.libelle, v.prixTtcDhParM2, v.superficieVendable, ht * v.superficieVendable]);
  }
  ws.addRow(["Total CA HT", null, result.ca.superficieTotale, result.ca.total]).font = {
    bold: true,
  };
  ws.addRow([]);

  ws.addRow(["II — Charges"]).font = { bold: true };
  const addLine = (label: string, value: number) => ws.addRow([label, null, null, value]);
  addLine("1. Acquisition", result.acquisition.total);
  addLine("   Achat terrain", result.acquisition.achatTerrain);
  addLine("   Enregistrement", result.acquisition.enregistrement);
  addLine("   Notaire", result.acquisition.notaire);
  addLine("2. Autorisations", result.autorisations.total);
  addLine("   Études", result.autorisations.etudes);
  addLine("   Suivi chantier", result.autorisations.suiviChantier);
  addLine("   Frais commune", result.autorisations.fraisCommune);
  addLine("3. Constructions", result.constructions.total);
  for (const l of result.constructions.lignes) addLine(`   ${l.libelle}`, l.cout);
  addLine("   Ascenseur", result.constructions.ascenseur);
  addLine("   Aménagements communs", result.constructions.amenagementsCommuns);
  addLine("   Aménagements façades", result.constructions.amenagementsFacades);
  addLine("4. Charges financières", result.chargesFinancieres.total);
  addLine("5. Charges liées à la vente", result.chargesVente.total);
  ws.addRow([]);

  const synthRow = ws.addRow(["III — Synthèse"]);
  synthRow.font = { bold: true };
  addLine("Total ventes", result.totaux.totalVentes);
  addLine("Total charges", result.totaux.totalCharges);
  addLine("EBIT", result.totaux.ebit);
  addLine("IS", result.totaux.is);
  const rn = ws.addRow(["Résultat net", null, null, result.totaux.resultatNet]);
  rn.font = { bold: true };
  addLine("Marge nette", result.totaux.margeNette);
  addLine("ROE projet", result.totaux.roe);
  addLine("TRI", adv.tri ?? 0);
  addLine("Cash-on-cash / an", adv.cashOnCash);
  addLine("Point mort prix apparts (DH/m²)", adv.pointMortPrixApparts ?? 0);

  ws.eachRow((row) => {
    row.getCell(4).numFmt = '#,##0;(#,##0);"-"';
    row.getCell(2).numFmt = "#,##0";
    row.getCell(3).numFmt = "#,##0";
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${sanitize(input.nom)}.xlsx`);
}

export function exportScenarioPdf(input: SimulationInput): void {
  const result = simulate(input);
  const adv = computeAdvancedMetrics(input, result);
  const win = window.open("", "_blank", "width=900,height=1200");
  if (!win) {
    alert("Activez l'ouverture de fenêtres pour générer le PDF.");
    return;
  }
  win.document.write(buildPrintHtml(input, result, adv));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

function buildPrintHtml(
  input: SimulationInput,
  result: ReturnType<typeof simulate>,
  adv: ReturnType<typeof computeAdvancedMetrics>,
): string {
  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR") + " DH";
  const pct = (n: number, d = 1) => (n * 100).toFixed(d) + " %";
  const m2 = (n: number) => Math.round(n).toLocaleString("fr-FR") + " m²";
  const tri = adv.tri == null ? "—" : pct(adv.tri);
  const pm = adv.pointMortPrixApparts == null ? "—" : fmt(adv.pointMortPrixApparts);
  const profitable = result.totaux.resultatNet > 0;

  const ventesRows = result.ca.lignes
    .map(
      (l) => `
        <tr>
          <td>${esc(l.libelle)}</td>
          <td class="num">${Math.round(l.prixHtDhParM2).toLocaleString("fr-FR")}</td>
          <td class="num">${m2(l.superficie)}</td>
          <td class="num strong">${fmt(l.ca)}</td>
        </tr>`,
    )
    .join("");

  const constructionsRows = result.constructions.lignes
    .map(
      (l) => `
        <tr class="sub">
          <td>${esc(l.libelle)}</td>
          <td class="num">${m2(l.superficie)}</td>
          <td class="num">${fmt(l.cout)}</td>
        </tr>`,
    )
    .join("");

  const sensiRows = adv.sensibilite
    .map((s) => {
      const sign = s.variation > 0 ? "+" : "";
      const deltaCls = s.delta >= 0 ? "pos" : "neg";
      return `
        <tr>
          <td>${esc(s.parametre)}</td>
          <td class="num">${sign}${(s.variation * 100).toFixed(0)} %</td>
          <td class="num ${deltaCls}">${s.delta >= 0 ? "+" : ""}${fmt(s.delta)}</td>
          <td class="num">${pct(s.margeNette)}</td>
        </tr>`;
    })
    .join("");

  const subRow = (label: string, val: number, indent = false) => `
    <tr ${indent ? 'class="sub"' : ""}>
      <td>${esc(label)}</td>
      <td class="num">${fmt(val)}</td>
    </tr>`;

  const totalRow = (label: string, val: number, level: "section" | "grand" = "section") => `
    <tr class="${level === "grand" ? "grand-total" : "section-total"}">
      <td>${esc(label)}</td>
      <td class="num">${fmt(val)}</td>
    </tr>`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>
<title>${esc(input.nom)} — Casa Urban</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #0f172a;
    font-size: 10.5pt;
    line-height: 1.45;
    background: #fff;
  }

  .brand {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  .brand h1 { margin: 0; font-size: 22pt; font-weight: 700; letter-spacing: -0.5px; }
  .brand .sub { font-size: 9pt; color: #64748b; margin-top: 2px; }
  .brand-tag {
    text-align: right;
    font-size: 9pt;
    color: #64748b;
  }
  .brand-tag strong { color: #0f172a; font-size: 11pt; }

  .terrain-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #2f81f7;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 16px;
    font-size: 10pt;
  }
  .terrain-card .row { display: flex; gap: 18px; flex-wrap: wrap; }
  .terrain-card .item { display: flex; flex-direction: column; }
  .terrain-card .label { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
  .terrain-card .value { font-size: 11pt; font-weight: 600; color: #0f172a; }

  .kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 18px;
  }
  .kpi {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    background: #fff;
    position: relative;
    overflow: hidden;
  }
  .kpi::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: #cbd5e1;
  }
  .kpi.primary::before { background: ${profitable ? "#16a34a" : "#dc2626"}; }
  .kpi.accent::before { background: #2f81f7; }
  .kpi-label { font-size: 8pt; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi-value { font-size: 14pt; font-weight: 700; margin-top: 3px; color: #0f172a; }
  .kpi.primary .kpi-value { color: ${profitable ? "#15803d" : "#b91c1c"}; }

  h2 {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: #0f172a;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    margin: 18px 0 8px;
  }

  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  th, td { padding: 5px 8px; text-align: left; vertical-align: top; }
  thead th {
    background: #0f172a;
    color: #fff;
    font-weight: 600;
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody tr:nth-child(even) { background: #fafafa; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.strong { font-weight: 600; }
  tr.sub td { padding-left: 22px; color: #475569; }

  tr.section-total {
    background: #f1f5f9 !important;
    font-weight: 600;
  }
  tr.section-total td { border-top: 1px solid #cbd5e1; }
  tr.grand-total {
    background: ${profitable ? "#dcfce7" : "#fee2e2"} !important;
    font-weight: 700;
    font-size: 10.5pt;
  }
  tr.grand-total td {
    border-top: 2px solid ${profitable ? "#16a34a" : "#dc2626"};
    color: ${profitable ? "#14532d" : "#7f1d1d"};
  }

  .pos { color: #15803d; }
  .neg { color: #b91c1c; }

  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .two-col h2 { margin-top: 14px; }

  .legend {
    font-size: 8pt;
    color: #64748b;
    margin-top: 4px;
  }

  .footer {
    margin-top: 18px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    color: #94a3b8;
  }

  .avoid-break { page-break-inside: avoid; }
  .page-break { page-break-before: always; }

  @media print {
    .no-print { display: none; }
  }
</style></head><body>
  <header class="brand">
    <div>
      <h1>${esc(input.nom)}</h1>
      <div class="sub">Pro forma promoteur — Aïn Chock, Casablanca</div>
    </div>
    <div class="brand-tag">
      <strong>Casa Urban</strong><br/>
      ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
    </div>
  </header>

  <section class="terrain-card avoid-break">
    <div class="row">
      <div class="item"><span class="label">Surface terrain</span><span class="value">${m2(input.terrain.surface)}</span></div>
      <div class="item"><span class="label">Prix terrain</span><span class="value">${fmt(input.terrain.prixTerrainDhParM2)}/m²</span></div>
      <div class="item"><span class="label">Étages</span><span class="value">RDC + ${input.terrain.nombreEtages}</span></div>
      ${input.terrain.facade1 ? `<div class="item"><span class="label">Façade 1</span><span class="value">${input.terrain.facade1} m</span></div>` : ""}
      ${input.terrain.facade2 ? `<div class="item"><span class="label">Façade 2</span><span class="value">${input.terrain.facade2} m</span></div>` : ""}
      <div class="item"><span class="label">Durée projet</span><span class="value">${input.hypotheses.dureeProjetAnnees} ans</span></div>
    </div>
  </section>

  <section class="kpis avoid-break">
    <div class="kpi primary">
      <div class="kpi-label">Résultat net</div>
      <div class="kpi-value">${fmt(result.totaux.resultatNet)}</div>
    </div>
    <div class="kpi accent">
      <div class="kpi-label">Marge nette</div>
      <div class="kpi-value">${pct(result.totaux.margeNette)}</div>
    </div>
    <div class="kpi accent">
      <div class="kpi-label">ROE projet</div>
      <div class="kpi-value">${pct(result.totaux.roe)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Chiffre d'affaires HT</div>
      <div class="kpi-value">${fmt(result.totaux.totalVentes)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">EBIT</div>
      <div class="kpi-value">${fmt(result.totaux.ebit)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Charges totales</div>
      <div class="kpi-value">${fmt(result.totaux.totalCharges)}</div>
    </div>
    <div class="kpi accent">
      <div class="kpi-label">TRI</div>
      <div class="kpi-value">${tri}</div>
    </div>
    <div class="kpi accent">
      <div class="kpi-label">Cash-on-cash / an</div>
      <div class="kpi-value">${pct(adv.cashOnCash)}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Point mort prix apparts</div>
      <div class="kpi-value">${pm}</div>
    </div>
  </section>

  <section class="avoid-break">
    <h2>I · Ventes (CA HT)</h2>
    <table>
      <thead>
        <tr>
          <th>Libellé</th>
          <th class="num">Prix HT (DH/m²)</th>
          <th class="num">Surface</th>
          <th class="num">CA HT</th>
        </tr>
      </thead>
      <tbody>
        ${ventesRows}
        <tr class="section-total">
          <td>Total CA HT</td>
          <td></td>
          <td class="num">${m2(result.ca.superficieTotale)}</td>
          <td class="num">${fmt(result.ca.total)}</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section class="avoid-break">
    <h2>II · Charges</h2>
    <table>
      <thead>
        <tr><th>Poste</th><th class="num">Montant (DH)</th></tr>
      </thead>
      <tbody>
        ${subRow("Achat terrain", result.acquisition.achatTerrain, true)}
        ${subRow("Enregistrement", result.acquisition.enregistrement, true)}
        ${subRow("Notaire", result.acquisition.notaire, true)}
        ${totalRow("1. Acquisition", result.acquisition.total)}

        ${subRow("Études", result.autorisations.etudes, true)}
        ${subRow("Suivi de chantier", result.autorisations.suiviChantier, true)}
        ${subRow("Frais commune", result.autorisations.fraisCommune, true)}
        ${totalRow("2. Autorisations", result.autorisations.total)}

        ${constructionsRows}
        ${subRow("Ascenseur", result.constructions.ascenseur, true)}
        ${subRow("Aménagements communs", result.constructions.amenagementsCommuns, true)}
        ${subRow("Aménagements façades", result.constructions.amenagementsFacades, true)}
        ${result.constructions.amenagementTemoin ? subRow("Apt témoin", result.constructions.amenagementTemoin, true) : ""}
        ${totalRow("3. Constructions", result.constructions.total)}

        ${subRow("Intérêts", result.chargesFinancieres.interets, true)}
        ${subRow("Frais ouverture compte", result.chargesFinancieres.fraisOuvertureCompte, true)}
        ${subRow("Hypothèque", result.chargesFinancieres.hypotheque, true)}
        ${totalRow("4. Charges financières", result.chargesFinancieres.total)}

        ${subRow("Compteur général", result.chargesVente.compteurGeneral, true)}
        ${subRow("Éclatement des titres", result.chargesVente.eclatementTitres, true)}
        ${subRow("Imprévus", result.chargesVente.imprevus, true)}
        ${totalRow("5. Charges liées à la vente", result.chargesVente.total)}

        ${subRow("Impôt sur les sociétés (IS)", result.totaux.is, true)}

        ${totalRow("Total charges", result.totaux.totalCharges, "grand")}
      </tbody>
    </table>
  </section>

  <section class="avoid-break page-break">
    <h2>III · Synthèse</h2>
    <table>
      <tbody>
        <tr><td>Chiffre d'affaires HT</td><td class="num strong">${fmt(result.totaux.totalVentes)}</td></tr>
        <tr><td>Total charges</td><td class="num">${fmt(result.totaux.totalCharges)}</td></tr>
        <tr class="section-total"><td>EBIT</td><td class="num">${fmt(result.totaux.ebit)}</td></tr>
        <tr><td>IS</td><td class="num">${fmt(result.totaux.is)}</td></tr>
        <tr class="grand-total"><td>Résultat net</td><td class="num">${fmt(result.totaux.resultatNet)}</td></tr>
      </tbody>
    </table>
  </section>

  <section class="avoid-break">
    <h2>IV · Analyse de sensibilité</h2>
    <p class="legend">Variations de ±5 % et ±10 % appliquées une à une sur les principaux paramètres, toutes choses égales par ailleurs.</p>
    <table>
      <thead>
        <tr>
          <th>Paramètre</th>
          <th class="num">Variation</th>
          <th class="num">Δ Résultat net</th>
          <th class="num">Marge nette</th>
        </tr>
      </thead>
      <tbody>${sensiRows}</tbody>
    </table>
  </section>

  <footer class="footer">
    <span>Casa Urban — Simulateur d'investissement immobilier · Aïn Chock</span>
    <span>Généré le ${new Date().toLocaleString("fr-FR")}</span>
  </footer>

</body></html>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 60) || "scenario";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
