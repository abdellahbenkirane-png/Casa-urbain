import { DEFAULT_HYPOTHESES, type SimulationInput } from "@casa/core";
import type { ParcelleProperties } from "../map/MapView";
import { programmeDefaut } from "./zoneProfiles";

/**
 * Construit un scénario initial à partir de la parcelle et de son zonage
 * (codes du PAU homologué 2025 : A, B, C, D, E, I, PB, PU, S, ZR…).
 *
 * Le programme (étages, villa / immeuble / bureaux, commerces, logement
 * social) découle du règlement de la zone — cf. zoneProfiles.ts.
 * L'investisseur ajuste tout dans le formulaire ensuite.
 */
export function buildInitialScenario(parcelle: ParcelleProperties): SimulationInput {
  const prog = programmeDefaut(parcelle.zone, parcelle.surface, parcelle.arrondissement);
  const h = prog.hypotheses;

  return {
    nom: `Scénario base ${parcelle.id}`,
    terrain: {
      surface: parcelle.surface,
      prixTerrainDhParM2: parcelle.prixTerrainMedianDhM2,
      nombreEtages: prog.etages,
      facade1: parcelle.facade1,
      facade2: parcelle.facade2,
    },
    ventes: prog.ventes,
    constructions: prog.constructions,
    hypotheses: {
      ...DEFAULT_HYPOTHESES,
      ...(h.ascenseurTtc != null && { ascenseurTtc: h.ascenseurTtc }),
      ...(h.amenagementsCommuns != null && { amenagementsCommuns: h.amenagementsCommuns }),
      ...(h.dureeChantierMois != null && { dureeChantierMois: h.dureeChantierMois }),
    },
  };
}
