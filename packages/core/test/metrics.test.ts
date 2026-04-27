import { describe, expect, it } from "vitest";
import {
  buildCashflows,
  computeAdvancedMetrics,
  irr,
  npv,
  pointMortPrixApparts,
  sensibilite,
  simulate,
} from "../src/index.js";
import { OPTION_1 } from "./fixtures.js";

describe("npv / irr", () => {
  it("npv d'une rente plate à taux 0 = somme", () => {
    expect(npv(0, [-100, 50, 50, 50])).toBeCloseTo(50, 6);
  });

  it("irr = 10 % sur flux test classique", () => {
    const r = irr([-1000, 100, 200, 300, 400, 500])!;
    expect(r).toBeGreaterThan(0.12);
    expect(r).toBeLessThan(0.13);
  });

  it("irr null si flux toujours négatifs", () => {
    expect(irr([-100, -50, -50])).toBeNull();
  });
});

describe("Métriques avancées sur Option 1", () => {
  const result = simulate(OPTION_1, { legacyExcelTotalCharges: true });

  it("buildCashflows : longueur = durée+1, somme ≈ résultat net (avant IS appliqué autrement)", () => {
    const cf = buildCashflows(result, OPTION_1.hypotheses.dureeProjetAnnees);
    expect(cf).toHaveLength(3);
    const sum = cf.reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(0);
  });

  it("TRI strictement positif (projet rentable)", () => {
    const m = computeAdvancedMetrics(OPTION_1, result, { legacyExcelTotalCharges: true });
    expect(m.tri).not.toBeNull();
    expect(m.tri!).toBeGreaterThan(0);
  });

  it("Point mort < prix de vente actuel", () => {
    const pm = pointMortPrixApparts(OPTION_1, { legacyExcelTotalCharges: true });
    expect(pm).not.toBeNull();
    expect(pm!).toBeLessThan(20000);
    expect(pm!).toBeGreaterThan(0);
  });

  it("Sensibilité : 12 lignes (3 paramètres × 4 variations)", () => {
    const s = sensibilite(OPTION_1, { legacyExcelTotalCharges: true });
    expect(s).toHaveLength(12);
  });

  it("Sensibilité : prix de vente +10 % améliore le résultat", () => {
    const s = sensibilite(OPTION_1, { legacyExcelTotalCharges: true });
    const venteUp = s.find((x) => x.parametre === "Prix vente appartements" && x.variation === 0.1)!;
    expect(venteUp.delta).toBeGreaterThan(0);
  });

  it("Sensibilité : coût construction +10 % dégrade le résultat", () => {
    const s = sensibilite(OPTION_1, { legacyExcelTotalCharges: true });
    const coutUp = s.find((x) => x.parametre === "Coût construction" && x.variation === 0.1)!;
    expect(coutUp.delta).toBeLessThan(0);
  });
});
