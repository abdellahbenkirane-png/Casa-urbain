import { DEFAULT_HYPOTHESES, type SimulationInput } from "@casa/core";
import { getZone } from "../zoning/zones";
import type { ParcelleProperties } from "../map/MapView";

/**
 * Construit un scénario initial à partir de la parcelle et de son zonage
 * (codes du PAU homologué 2025 : A, B, C, D, E, I, PB, PU, S, ZR…).
 *
 * Heuristique :
 *  - Surface plancher constructible ≈ surface_terrain × COS (si COS défini)
 *  - sinon ≈ surface_terrain × ratio dérivé du nombre d'étages
 *  - Surface vendable ≈ 85 % de la surface plancher (déduction parties communes)
 *  - Allocation par défaut : RDC commercial sur ~30 % de la surface, le reste en
 *    appartements, plus une terrasse égale à ~50 % de la surface terrain
 *
 * L'investisseur ajuste tout dans le formulaire ensuite.
 */
export function buildInitialScenario(parcelle: ParcelleProperties): SimulationInput {
  const zone = getZone(parcelle.zone);
  const cosParEtage = zone?.parametres.cos ?? null;
  const etagesMax = zone?.parametres.nombreEtagesMax ?? 4;
  const etagesEffectifs = etagesMax > 0 ? etagesMax : 4;
  const niveaux = etagesEffectifs + 1; // RDC + étages
  // COS du PAU est par étage : surface plancher totale = cos × niveaux × terrain.
  // Si COS non fixé, on retombe sur un ratio raisonnable basé sur les étages.
  const cosTotal = cosParEtage != null ? cosParEtage * niveaux : Math.max(1, niveaux * 0.6);
  const surfacePlancher = parcelle.surface * cosTotal;
  const surfaceVendable = surfacePlancher * 0.85;

  // 30 % de la surface vendable en commerce RDC max, plafonné à la surface au sol
  const surfaceLC = Math.min(surfaceVendable * 0.3, parcelle.surface * 0.7);
  const surfaceApparts = Math.max(0, surfaceVendable - surfaceLC);

  // Coût construction : RDC/sous-sol moins cher, étages plus chers
  const surfaceConstrSousSol = parcelle.surface * 0.7 + surfaceLC;
  const surfaceConstrEtages = Math.max(0, surfacePlancher - surfaceConstrSousSol);

  return {
    nom: `Scénario base ${parcelle.id}`,
    terrain: {
      surface: parcelle.surface,
      prixTerrainDhParM2: parcelle.prixTerrainMedianDhM2,
      nombreEtages: etagesEffectifs,
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
        superficieConstruite: Math.round(surfaceConstrSousSol),
      },
      {
        libelle: "Étages courants",
        prixHtDhParM2: 3800,
        superficieConstruite: Math.round(surfaceConstrEtages),
      },
    ],
    hypotheses: { ...DEFAULT_HYPOTHESES },
  };
}
