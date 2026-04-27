import { describe, expect, it } from "vitest";
import { simulate } from "../src/engine.js";
import { OPTION_1, OPTION_2 } from "./fixtures.js";

const eps = 0.01;
const close = (got: number, expected: number, tol = eps) =>
  expect(Math.abs(got - expected)).toBeLessThan(tol);

describe("Option 1 — parité Excel", () => {
  const out = simulate(OPTION_1, { legacyExcelTotalCharges: true });

  it("CA par ligne et total", () => {
    close(out.ca.lignes[0]!.ca, 12504347.826087);
    close(out.ca.lignes[1]!.ca, 2000000);
    close(out.ca.lignes[2]!.ca, 8543478.26087);
    close(out.ca.total, 23047826.086957);
  });

  it("Acquisition", () => {
    close(out.acquisition.achatTerrain, -8050000);
    close(out.acquisition.enregistrement, -483000);
    close(out.acquisition.notaire, -30000);
    close(out.acquisition.total, -8563000);
  });

  it("Constructions", () => {
    close(out.constructions.lignes[0]!.cout, -1577600);
    close(out.constructions.lignes[1]!.cout, -3815200);
    close(out.constructions.coutBatiment, -5392800);
    close(out.constructions.ascenseur, -166666.666667);
    close(out.constructions.coutAutres, -326666.666667);
    close(out.constructions.total, -5719466.666667);
  });

  it("Autorisations", () => {
    close(out.autorisations.etudes, -285973.333333);
    close(out.autorisations.suiviChantier, -180000);
    close(out.autorisations.fraisCommune, -100000);
    close(out.autorisations.total, -565973.333333);
  });

  it("Charges financières", () => {
    close(out.chargesFinancieres.interets, -754252.8);
    close(out.chargesFinancieres.total, -934752.8);
  });

  it("Charges vente", () => {
    close(out.chargesVente.total, -1306673.913043);
  });

  it("Synthèse", () => {
    close(out.totaux.totalVentes, 23047826.086957);
    close(out.totaux.totalCharges, -16909866.713043);
    close(out.totaux.ebit, 6137959.373913);
    close(out.totaux.is, -1350351.062261);
    close(out.totaux.resultatNet, 4787608.311652);
    close(out.totaux.margeNette, 0.207725, 1e-5);
    close(out.totaux.roe, 0.559104, 1e-5);
  });
});

describe("Option 2 — parité Excel", () => {
  const out = simulate(OPTION_2, { legacyExcelTotalCharges: true });

  it("CA total", () => {
    close(out.ca.total, 22808695.652174);
  });

  it("Constructions", () => {
    close(out.constructions.lignes[0]!.cout, -1135600);
    close(out.constructions.lignes[1]!.cout, -4187600);
    close(out.constructions.total, -5649866.666667);
  });

  it("Autorisations", () => {
    close(out.autorisations.total, -562493.333333);
  });

  it("Charges financières", () => {
    close(out.chargesFinancieres.total, -925983.2);
  });

  it("Synthèse", () => {
    close(out.totaux.totalVentes, 22808695.652174);
    close(out.totaux.totalCharges, -16819647.547826);
    close(out.totaux.ebit, 5989048.104348);
    close(out.totaux.resultatNet, 4671457.521391);
    close(out.totaux.margeNette, 0.20481, 1e-5);
    close(out.totaux.roe, 0.54554, 1e-5);
  });
});

describe("Mode complet (suivi de chantier inclus)", () => {
  it("résultat net Option 1 plus faible de 180 000 × (1 - IS) que la version Excel", () => {
    const legacy = simulate(OPTION_1, { legacyExcelTotalCharges: true });
    const fixed = simulate(OPTION_1);
    const expectedDelta = -180000 * (1 - 0.22);
    close(fixed.totaux.resultatNet - legacy.totaux.resultatNet, expectedDelta, 1);
  });
});
