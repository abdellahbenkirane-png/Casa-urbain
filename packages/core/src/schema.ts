// Types d'entrée du moteur. Ce sont de simples types TypeScript : rien n'est
// validé à l'exécution (zod n'était utilisé que pour en déduire les types et
// alourdissait le calculateur de ~50 kB). Unités rappelées en commentaire.

export interface Terrain {
  /** m² (> 0) */
  surface: number;
  /** DH/m² */
  prixTerrainDhParM2: number;
  /** étages au-dessus du RDC (entier ≥ 0) */
  nombreEtages: number;
  facade1?: number;
  facade2?: number;
  profondeur1?: number;
  profondeur2?: number;
  saillie?: number;
}

export interface VenteLigne {
  libelle: string;
  /** DH TTC/m² */
  prixTtcDhParM2: number;
  /** m² */
  superficieVendable: number;
}

export interface ConstructionLigne {
  libelle: string;
  /** DH HT/m² */
  prixHtDhParM2: number;
  /** m² */
  superficieConstruite: number;
}

/** Les taux sont des fractions (5 % → 0.05), les montants en DH. */
export interface Hypotheses {
  tvaVente: number;
  tvaConstruction: number;
  tauxEnregistrement: number;
  notaireForfait: number;
  tauxEtudes: number;
  suiviChantierParMois: number;
  /** mois (entier) */
  dureeChantierMois: number;
  fraisCommune: number;
  ascenseurTtc: number;
  amenagementsCommuns: number;
  amenagementsFacades: number;
  amenagementTemoin: number;
  tauxChargesFinancieres: number;
  /** années (> 0) */
  dureeProjetAnnees: number;
  fraisOuvertureCompte: number;
  tauxHypotheque: number;
  compteurGeneral: number;
  tauxEclatementTitres: number;
  tauxImprevus: number;
  tauxIs: number;
}

export interface SimulationInput {
  nom: string;
  terrain: Terrain;
  ventes: VenteLigne[];
  constructions: ConstructionLigne[];
  hypotheses: Hypotheses;
}

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
