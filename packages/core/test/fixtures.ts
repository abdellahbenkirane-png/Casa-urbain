import type { SimulationInput } from "../src/schema.js";
import { DEFAULT_HYPOTHESES } from "../src/defaults.js";

/**
 * Reproduit "Terrain Option 1" du fichier Etude Bachkhou v2.xlsx
 * (commerce avec mezzanine).
 */
export const OPTION_1: SimulationInput = {
  nom: "Option 1 — commerce avec mezzanine",
  terrain: {
    surface: 350,
    prixTerrainDhParM2: 23000,
    nombreEtages: 5,
  },
  ventes: [
    { libelle: "Appartements/balcon", prixTtcDhParM2: 20000, superficieVendable: 24 + 735 - 40 },
    { libelle: "Terrasse", prixTtcDhParM2: 10000, superficieVendable: 230 },
    { libelle: "Local commercial", prixTtcDhParM2: 30000, superficieVendable: 270 + 67.5 - 10 },
  ],
  constructions: [
    {
      libelle: "Sous-sol et magasins + Edicule",
      prixHtDhParM2: 1700,
      superficieConstruite: 350 + 350 + 260 + 24 - 28 * 2,
    },
    {
      libelle: "Appartements",
      prixHtDhParM2: 3800,
      superficieConstruite: 270 * 2 + 262 + 200 + 142 - 28 * 5,
    },
  ],
  hypotheses: { ...DEFAULT_HYPOTHESES },
};

/**
 * Reproduit "Terrain Option 2" du fichier Etude Bachkhou v2.xlsx
 * (commerce sans mezzanine).
 */
export const OPTION_2: SimulationInput = {
  nom: "Option 2 — commerce sans mezzanine",
  terrain: {
    surface: 350,
    prixTerrainDhParM2: 23000,
    nombreEtages: 5,
  },
  ventes: [
    { libelle: "Appartements/balcon", prixTtcDhParM2: 20000, superficieVendable: 825 + 24 - 35 },
    { libelle: "Terrasse", prixTtcDhParM2: 10000, superficieVendable: 215 },
    { libelle: "Local commercial", prixTtcDhParM2: 30000, superficieVendable: 270 - 10 },
  ],
  constructions: [
    {
      libelle: "Sous-sol et magasins + Edicule",
      prixHtDhParM2: 1700,
      superficieConstruite: 350 + 350 + 24 - 28 * 2,
    },
    {
      libelle: "Appartements",
      prixHtDhParM2: 3800,
      superficieConstruite: 270 * 2 + 262 + 240 + 200 - 28 * 5,
    },
  ],
  hypotheses: { ...DEFAULT_HYPOTHESES },
};
