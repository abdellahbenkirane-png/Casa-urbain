import type { Hypotheses } from "./schema.js";

/**
 * Hypothèses par défaut calées sur le pro forma source (Etude Bachkhou v2).
 * Tous les pourcentages sont exprimés en fraction (5 % → 0.05).
 */
export const DEFAULT_HYPOTHESES: Hypotheses = {
  tvaVente: 0.15,
  tvaConstruction: 0.2,
  tauxEnregistrement: 0.06,
  notaireForfait: 30000,
  tauxEtudes: 0.05,
  suiviChantierParMois: 15000,
  dureeChantierMois: 12,
  fraisCommune: 100000,
  ascenseurTtc: 200000,
  amenagementsCommuns: 80000,
  amenagementsFacades: 80000,
  amenagementTemoin: 0,
  tauxChargesFinancieres: 0.06,
  dureeProjetAnnees: 2,
  fraisOuvertureCompte: 100000,
  tauxHypotheque: 0.01,
  compteurGeneral: 500000,
  tauxEclatementTitres: 0.025,
  tauxImprevus: 0.01,
  tauxIs: 0.22,
};
