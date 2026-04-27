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

  // Note : les contrôles COS / CUS ont été désactivés à la demande de
  // l'utilisateur. Les valeurs restent dans pau-zones.json pour pouvoir
  // les réactiver une fois les règles de calcul (par étage / total)
  // confirmées avec les services de l'AUC.

  return v;
}

export function maxSurfacePlancher(zone: Zone | undefined, surfaceTerrain: number): number | null {
  if (!zone?.parametres.cos || surfaceTerrain <= 0) return null;
  const niveaux = (zone.parametres.nombreEtagesMax ?? 0) + 1;
  return zone.parametres.cos * niveaux * surfaceTerrain;
}
