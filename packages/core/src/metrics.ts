import { simulate, type SimulateOptions } from "./engine.js";
import type { SimulationInput, SimulationOutput } from "./schema.js";

/**
 * Calcule la VAN (NPV) d'une série de flux à un taux donné.
 * Le premier flux est à t=0.
 */
export function npv(rate: number, cashflows: number[]): number {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}

/**
 * TRI (IRR) par bissection. Retourne null si pas de signe changeant
 * ou si la convergence échoue.
 */
export function irr(cashflows: number[]): number | null {
  const totalPos = cashflows.filter((c) => c > 0).reduce((a, b) => a + b, 0);
  const totalNeg = cashflows.filter((c) => c < 0).reduce((a, b) => a + b, 0);
  if (totalPos <= 0 || totalNeg >= 0) return null;

  let low = -0.99;
  let high = 10;
  let fLow = npv(low, cashflows);
  let fHigh = npv(high, cashflows);
  if (fLow * fHigh > 0) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const fMid = npv(mid, cashflows);
    if (Math.abs(fMid) < 1e-2) return mid;
    if (fMid * fLow < 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }
  return (low + high) / 2;
}

/**
 * Construit une série de flux sur la durée du projet. Hypothèses :
 * - t=0 : achat terrain + frais d'acquisition + 50 % du compteur général
 * - répartition uniforme des charges de construction et autorisations sur la durée
 * - charges financières et frais d'ouverture compte au début
 * - encaissements de vente répartis sur la dernière année
 */
export function buildCashflows(
  result: SimulationOutput,
  dureeAnnees: number,
): number[] {
  const periods = Math.max(1, Math.round(dureeAnnees));
  const cashflows: number[] = new Array(periods + 1).fill(0);

  cashflows[0] = result.acquisition.total + result.chargesFinancieres.fraisOuvertureCompte;

  const constructionAnnuel = result.constructions.total / periods;
  const autorisationsAnnuel = result.autorisations.total / periods;
  const fraisFinAnnuel =
    (result.chargesFinancieres.interets + result.chargesFinancieres.hypotheque) / periods;

  for (let t = 1; t <= periods; t++) {
    cashflows[t] += constructionAnnuel + autorisationsAnnuel + fraisFinAnnuel;
  }

  cashflows[periods]! +=
    result.totaux.totalVentes +
    result.chargesVente.total +
    result.totaux.is;

  return cashflows;
}

export interface AdvancedMetrics {
  tri: number | null;
  cashOnCash: number;
  pointMortPrixApparts: number | null;
  sensibilite: SensibiliteResult[];
}

export interface SensibiliteResult {
  parametre: string;
  variation: number;
  resultatNet: number;
  margeNette: number;
  delta: number;
}

/**
 * Calcul du point mort sur le prix de vente des appartements
 * (résultat net = 0). On itère par bissection sur un facteur multiplicatif.
 */
export function pointMortPrixApparts(
  base: SimulationInput,
  options: SimulateOptions = {},
): number | null {
  const appartIdx = base.ventes.findIndex((v) =>
    v.libelle.toLowerCase().includes("appart"),
  );
  if (appartIdx < 0) return null;
  const prixBase = base.ventes[appartIdx]!.prixTtcDhParM2;

  const computeResNet = (factor: number) => {
    const input: SimulationInput = {
      ...base,
      ventes: base.ventes.map((v, i) =>
        i === appartIdx ? { ...v, prixTtcDhParM2: prixBase * factor } : v,
      ),
    };
    return simulate(input, options).totaux.resultatNet;
  };

  let low = 0.1;
  let high = 3;
  let fLow = computeResNet(low);
  let fHigh = computeResNet(high);
  if (fLow * fHigh > 0) return null;

  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    const fMid = computeResNet(mid);
    if (Math.abs(fMid) < 100) return prixBase * mid;
    if (fMid * fLow < 0) {
      high = mid;
      fHigh = fMid;
    } else {
      low = mid;
      fLow = fMid;
    }
  }
  return prixBase * ((low + high) / 2);
}

interface SensiSpec {
  parametre: string;
  apply: (input: SimulationInput, factor: number) => SimulationInput;
}

const SENSI_SPECS: SensiSpec[] = [
  {
    parametre: "Prix terrain",
    apply: (i, f) => ({
      ...i,
      terrain: { ...i.terrain, prixTerrainDhParM2: i.terrain.prixTerrainDhParM2 * f },
    }),
  },
  {
    parametre: "Prix vente appartements",
    apply: (i, f) => ({
      ...i,
      ventes: i.ventes.map((v) =>
        v.libelle.toLowerCase().includes("appart")
          ? { ...v, prixTtcDhParM2: v.prixTtcDhParM2 * f }
          : v,
      ),
    }),
  },
  {
    parametre: "Coût construction",
    apply: (i, f) => ({
      ...i,
      constructions: i.constructions.map((c) => ({
        ...c,
        prixHtDhParM2: c.prixHtDhParM2 * f,
      })),
    }),
  },
];

const SENSI_FACTORS = [-0.1, -0.05, 0.05, 0.1];

export function sensibilite(
  base: SimulationInput,
  options: SimulateOptions = {},
): SensibiliteResult[] {
  const baseRes = simulate(base, options);
  const results: SensibiliteResult[] = [];
  for (const spec of SENSI_SPECS) {
    for (const f of SENSI_FACTORS) {
      const sim = simulate(spec.apply(base, 1 + f), options);
      results.push({
        parametre: spec.parametre,
        variation: f,
        resultatNet: sim.totaux.resultatNet,
        margeNette: sim.totaux.margeNette,
        delta: sim.totaux.resultatNet - baseRes.totaux.resultatNet,
      });
    }
  }
  return results;
}

export function computeAdvancedMetrics(
  input: SimulationInput,
  result: SimulationOutput,
  options: SimulateOptions = {},
): AdvancedMetrics {
  const cashflows = buildCashflows(result, input.hypotheses.dureeProjetAnnees);
  const equity = -result.acquisition.total;
  return {
    tri: irr(cashflows),
    cashOnCash:
      equity === 0
        ? 0
        : result.totaux.resultatNet / equity / input.hypotheses.dureeProjetAnnees,
    pointMortPrixApparts: pointMortPrixApparts(input, options),
    sensibilite: sensibilite(input, options),
  };
}
