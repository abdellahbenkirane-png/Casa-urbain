import { z } from "zod";

export const TerrainSchema = z.object({
  surface: z.number().positive(),
  prixTerrainDhParM2: z.number().nonnegative(),
  nombreEtages: z.number().int().nonnegative(),
  facade1: z.number().nonnegative().optional(),
  facade2: z.number().nonnegative().optional(),
  profondeur1: z.number().nonnegative().optional(),
  profondeur2: z.number().nonnegative().optional(),
  saillie: z.number().nonnegative().optional(),
});
export type Terrain = z.infer<typeof TerrainSchema>;

export const VenteLigneSchema = z.object({
  libelle: z.string(),
  prixTtcDhParM2: z.number().nonnegative(),
  superficieVendable: z.number().nonnegative(),
});
export type VenteLigne = z.infer<typeof VenteLigneSchema>;

export const ConstructionLigneSchema = z.object({
  libelle: z.string(),
  prixHtDhParM2: z.number().nonnegative(),
  superficieConstruite: z.number().nonnegative(),
});
export type ConstructionLigne = z.infer<typeof ConstructionLigneSchema>;

export const HypothesesSchema = z.object({
  tvaVente: z.number().min(0).max(1),
  tvaConstruction: z.number().min(0).max(1),
  tauxEnregistrement: z.number().min(0).max(1),
  notaireForfait: z.number().nonnegative(),
  tauxEtudes: z.number().min(0).max(1),
  suiviChantierParMois: z.number().nonnegative(),
  dureeChantierMois: z.number().int().nonnegative(),
  fraisCommune: z.number().nonnegative(),
  ascenseurTtc: z.number().nonnegative(),
  amenagementsCommuns: z.number().nonnegative(),
  amenagementsFacades: z.number().nonnegative(),
  amenagementTemoin: z.number().nonnegative(),
  tauxChargesFinancieres: z.number().min(0).max(1),
  dureeProjetAnnees: z.number().positive(),
  fraisOuvertureCompte: z.number().nonnegative(),
  tauxHypotheque: z.number().min(0).max(1),
  compteurGeneral: z.number().nonnegative(),
  tauxEclatementTitres: z.number().min(0).max(1),
  tauxImprevus: z.number().min(0).max(1),
  tauxIs: z.number().min(0).max(1),
});
export type Hypotheses = z.infer<typeof HypothesesSchema>;

export const SimulationInputSchema = z.object({
  nom: z.string().default("Scénario"),
  terrain: TerrainSchema,
  ventes: z.array(VenteLigneSchema),
  constructions: z.array(ConstructionLigneSchema),
  hypotheses: HypothesesSchema,
});
export type SimulationInput = z.infer<typeof SimulationInputSchema>;

export interface SimulationOutput {
  ca: {
    lignes: { libelle: string; prixHtDhParM2: number; superficie: number; ca: number }[];
    superficieTotale: number;
    total: number;
  };
  acquisition: {
    achatTerrain: number;
    enregistrement: number;
    notaire: number;
    total: number;
  };
  autorisations: {
    etudes: number;
    suiviChantier: number;
    fraisCommune: number;
    total: number;
  };
  constructions: {
    lignes: { libelle: string; prixHt: number; superficie: number; cout: number }[];
    superficieTotale: number;
    coutBatiment: number;
    ascenseur: number;
    amenagementsCommuns: number;
    amenagementsFacades: number;
    amenagementTemoin: number;
    coutAutres: number;
    total: number;
  };
  chargesFinancieres: {
    interets: number;
    fraisOuvertureCompte: number;
    hypotheque: number;
    total: number;
  };
  chargesVente: {
    compteurGeneral: number;
    eclatementTitres: number;
    imprevus: number;
    total: number;
  };
  totaux: {
    totalVentes: number;
    totalCharges: number;
    ebit: number;
    is: number;
    resultatNet: number;
    margeNette: number;
    roe: number;
  };
}
