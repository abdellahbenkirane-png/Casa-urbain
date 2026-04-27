import type { SimulationInput } from "@casa/core";
import { getZone, type Zone } from "../zoning/zones";

export interface Violation {
  severity: "error" | "warning";
  field: string;
  message: string;
  ruleValue: number;
  actualValue: number;
}

/**
 * Vérifie un scénario contre les règles du zonage PAU 2025 du sous-secteur
 * indiqué (ex. "B5", "D3", "S4"…). Retourne la liste des violations détectées.
 *
 * - error : la règle est explicite et l'écart est franc → bloquant pour un PC
 * - warning : la valeur est limite ou la règle est implicite → à valider
 */
export function validate(input: SimulationInput, zoneCode: string): Violation[] {
  const zone = getZone(zoneCode);
  if (!zone) return [];
  const v: Violation[] = [];
  const p = zone.parametres;
  const t = input.terrain;

  if (p.surfaceMinParcelleM2 != null && t.surface < p.surfaceMinParcelleM2) {
    v.push({
      severity: "error",
      field: "terrain.surface",
      message: `Surface terrain ${t.surface} m² < surface min ${p.surfaceMinParcelleM2} m² (zone ${zone.code})`,
      ruleValue: p.surfaceMinParcelleM2,
      actualValue: t.surface,
    });
  }

  if (p.facadeMinM != null) {
    const facade = Math.max(t.facade1 ?? 0, t.facade2 ?? 0);
    if (facade > 0 && facade < p.facadeMinM) {
      v.push({
        severity: "error",
        field: "terrain.facade",
        message: `Façade ${facade} m < façade min ${p.facadeMinM} m (zone ${zone.code})`,
        ruleValue: p.facadeMinM,
        actualValue: facade,
      });
    }
  }

  if (p.nombreEtagesMax != null && t.nombreEtages > p.nombreEtagesMax) {
    v.push({
      severity: "error",
      field: "terrain.nombreEtages",
      message: `Nombre d'étages ${t.nombreEtages} > max ${p.nombreEtagesMax} (zone ${zone.code}, RDC + ${p.nombreEtagesMax})`,
      ruleValue: p.nombreEtagesMax,
      actualValue: t.nombreEtages,
    });
  }

  // COS = coefficient d'occupation du sol PAR ÉTAGE.
  // Plafond total = cos × (RDC + nombreEtagesMax). On compare la surface
  // plancher cumulée à ce plafond.
  if (p.cos != null && t.surface > 0) {
    const niveaux = (p.nombreEtagesMax ?? 0) + 1; // RDC + étages
    const cosMaxTotal = p.cos * niveaux;
    const surfacePlancher = input.constructions.reduce(
      (acc, c) => acc + c.superficieConstruite,
      0,
    );
    const cosActuel = surfacePlancher / t.surface;
    if (cosActuel > cosMaxTotal * 1.05) {
      v.push({
        severity: "error",
        field: "constructions",
        message: `COS total dépassé : ${cosActuel.toFixed(2)} > ${cosMaxTotal.toFixed(2)} (COS ${p.cos.toFixed(2)}/étage × ${niveaux} niveaux ; surface plancher ${Math.round(surfacePlancher)} m² sur terrain ${t.surface} m²)`,
        ruleValue: cosMaxTotal,
        actualValue: cosActuel,
      });
    } else if (cosActuel > cosMaxTotal) {
      v.push({
        severity: "warning",
        field: "constructions",
        message: `COS total limite : ${cosActuel.toFixed(2)} ≈ max ${cosMaxTotal.toFixed(2)} (COS ${p.cos.toFixed(2)}/étage × ${niveaux})`,
        ruleValue: cosMaxTotal,
        actualValue: cosActuel,
      });
    }
  }

  // CUS = emprise au sol / surface terrain
  // Heuristique : on prend la plus grande superficie de construction comme
  // approximation de l'emprise au sol (généralement le RDC ou le sous-sol).
  if (p.cus != null && t.surface > 0 && input.constructions.length > 0) {
    const empriseSol = Math.max(...input.constructions.map((c) => c.superficieConstruite));
    const cusActuel = empriseSol / t.surface;
    if (cusActuel > p.cus * 1.05) {
      v.push({
        severity: "warning",
        field: "constructions.empriseSol",
        message: `CUS dépassé : ${(cusActuel * 100).toFixed(0)} % > ${(p.cus * 100).toFixed(0)} % (emprise estimée ${Math.round(empriseSol)} m²)`,
        ruleValue: p.cus,
        actualValue: cusActuel,
      });
    }
  }

  return v;
}

export function maxSurfacePlancher(zone: Zone | undefined, surfaceTerrain: number): number | null {
  if (!zone?.parametres.cos || surfaceTerrain <= 0) return null;
  const niveaux = (zone.parametres.nombreEtagesMax ?? 0) + 1;
  return zone.parametres.cos * niveaux * surfaceTerrain;
}
