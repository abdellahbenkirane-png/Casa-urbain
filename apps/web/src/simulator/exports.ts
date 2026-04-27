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
  setTimeout(() => win.print(), 300);
}

function buildPrintHtml(
  input: SimulationInput,
  result: ReturnType<typeof simulate>,
  adv: ReturnType<typeof computeAdvancedMetrics>,
): string {
  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR") + " DH";
  const pct = (n: number) => (n * 100).toFixed(1) + " %";
  const tri = adv.tri == null ? "—" : pct(adv.tri);
  const pm =
    adv.pointMortPrixApparts == null ? "—" : fmt(adv.pointMortPrixApparts);

  const ventesRows = result.ca.lignes
    .map(
      (l) =>
        `<tr><td>${esc(l.libelle)}</td><td>${l.superficie.toLocaleString("fr-FR")}</td><td>${fmt(l.ca)}</td></tr>`,
    )
    .join("");

  const chargeRow = (label: string, val: number) =>
    `<tr><td>${esc(label)}</td><td>${fmt(val)}</td></tr>`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/>
  <title>${esc(input.nom)}</title>
  <style>
    body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;padding:24px;font-size:12px;}
    h1{font-size:20px;margin:0 0 8px;}
    h2{font-size:14px;margin:18px 0 6px;border-bottom:1px solid #999;padding-bottom:2px;}
    table{border-collapse:collapse;width:100%;margin-bottom:8px;}
    td,th{padding:4px 6px;border-bottom:1px solid #ddd;text-align:left;}
    td:last-child,th:last-child{text-align:right;}
    .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 16px;}
    .kpi{border:1px solid #ccc;padding:8px;border-radius:6px;}
    .kpi-label{font-size:10px;color:#666;text-transform:uppercase;}
    .kpi-value{font-size:14px;font-weight:600;}
    .footer{font-size:9px;color:#666;margin-top:24px;}
  </style></head><body>
    <h1>${esc(input.nom)}</h1>
    <div>Terrain ${input.terrain.surface} m² · ${fmt(input.terrain.prixTerrainDhParM2)}/m² · ${input.terrain.nombreEtages} étages</div>
    <div class="kpis">
      <div class="kpi"><div class="kpi-label">CA HT</div><div class="kpi-value">${fmt(result.totaux.totalVentes)}</div></div>
      <div class="kpi"><div class="kpi-label">Résultat net</div><div class="kpi-value">${fmt(result.totaux.resultatNet)}</div></div>
      <div class="kpi"><div class="kpi-label">Marge nette</div><div class="kpi-value">${pct(result.totaux.margeNette)}</div></div>
      <div class="kpi"><div class="kpi-label">ROE projet</div><div class="kpi-value">${pct(result.totaux.roe)}</div></div>
      <div class="kpi"><div class="kpi-label">TRI</div><div class="kpi-value">${tri}</div></div>
      <div class="kpi"><div class="kpi-label">Point mort apparts</div><div class="kpi-value">${pm}</div></div>
    </div>
    <h2>I — Ventes</h2>
    <table><thead><tr><th>Libellé</th><th>Surface</th><th>CA HT</th></tr></thead>
    <tbody>${ventesRows}</tbody></table>
    <h2>II — Charges</h2>
    <table><tbody>
      ${chargeRow("Acquisition", result.acquisition.total)}
      ${chargeRow("Autorisations", result.autorisations.total)}
      ${chargeRow("Constructions", result.constructions.total)}
      ${chargeRow("Charges financières", result.chargesFinancieres.total)}
      ${chargeRow("Charges liées à la vente", result.chargesVente.total)}
      ${chargeRow("IS", result.totaux.is)}
    </tbody></table>
    <h2>III — Synthèse</h2>
    <table><tbody>
      ${chargeRow("Total ventes", result.totaux.totalVentes)}
      ${chargeRow("Total charges", result.totaux.totalCharges)}
      ${chargeRow("EBIT", result.totaux.ebit)}
      ${chargeRow("Résultat net", result.totaux.resultatNet)}
    </tbody></table>
    <div class="footer">Casa Urban — généré le ${new Date().toLocaleString("fr-FR")}</div>
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
