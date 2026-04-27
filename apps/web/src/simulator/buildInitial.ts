import { DEFAULT_HYPOTHESES, type SimulationInput } from "@casa/core";
import { getZone } from "../zoning/zones";
import type { ParcelleProperties } from "../map/MapView";

/**
 * Construit un scénario initial à partir de la parcelle et de son zonage.
 * L'investisseur peut tout modifier ensuite dans le formulaire.
 */
export function buildInitialScenario(parcelle: ParcelleProperties): SimulationInput {
  const zone = getZone(parcelle.zone);
  const cus = zone?.parametres.cus ?? 1.5;
  const empriseSol = zone?.parametres.emprisAuSolMaxPct ?? 0.6;
  const etages = zone?.parametres.nombreEtagesMax ?? 4;

  const surfaceConstructibleSol = parcelle.surface * empriseSol;
  const surfacePlancher = parcelle.surface * cus;
  const surfaceVendable = surfacePlancher * 0.85;
  const surfaceLC = surfaceConstructibleSol;
  const surfaceApparts = Math.max(0, surfaceVendable - surfaceLC);

  return {
    nom: `Scénario base ${parcelle.id}`,
    terrain: {
      surface: parcelle.surface,
      prixTerrainDhParM2: parcelle.prixTerrainMedianDhM2,
      nombreEtages: etages,
      facade1: parcelle.facade1,
      facade2: parcelle.facade2,
    },
    ventes: [
      {
        libelle: "Appartements",
        prixTtcDhParM2: 20000,
        superficieVendable: Math.round(surfaceApparts),
      },
      {
        libelle: "Local commercial RDC",
        prixTtcDhParM2: 30000,
        superficieVendable: Math.round(surfaceLC),
      },
      {
        libelle: "Terrasse",
        prixTtcDhParM2: 10000,
        superficieVendable: Math.round(parcelle.surface * 0.5),
      },
    ],
    constructions: [
      {
        libelle: "Sous-sol et RDC",
        prixHtDhParM2: 1700,
        superficieConstruite: Math.round(surfaceConstructibleSol * 2),
      },
      {
        libelle: "Étages courants",
        prixHtDhParM2: 3800,
        superficieConstruite: Math.round(surfacePlancher - surfaceConstructibleSol),
      },
    ],
    hypotheses: { ...DEFAULT_HYPOTHESES },
  };
}
