import type {
  ConstructionLigne,
  Hypotheses,
  SimulationInput,
  SimulationOutput,
  VenteLigne,
} from "./schema.js";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

function computeCa(ventes: VenteLigne[], tvaVente: number) {
  const lignes = ventes.map((v) => {
    const prixHtDhParM2 = v.prixTtcDhParM2 / (1 + tvaVente);
    const ca = prixHtDhParM2 * v.superficieVendable;
    return {
      libelle: v.libelle,
      prixHtDhParM2,
      superficie: v.superficieVendable,
      ca,
    };
  });
  return {
    lignes,
    superficieTotale: sum(lignes.map((l) => l.superficie)),
    total: sum(lignes.map((l) => l.ca)),
  };
}

function computeAcquisition(
  surface: number,
  prixDhParM2: number,
  tauxEnregistrement: number,
  notaireForfait: number,
) {
  const achatTerrain = -surface * prixDhParM2;
  const enregistrement = achatTerrain * tauxEnregistrement;
  const notaire = -notaireForfait;
  return {
    achatTerrain,
    enregistrement,
    notaire,
    total: achatTerrain + enregistrement + notaire,
  };
}

function computeConstructions(constructions: ConstructionLigne[], h: Hypotheses) {
  const lignes = constructions.map((c) => ({
    libelle: c.libelle,
    prixHt: c.prixHtDhParM2,
    superficie: c.superficieConstruite,
    cout: -c.prixHtDhParM2 * c.superficieConstruite,
  }));
  const coutBatiment = sum(lignes.map((l) => l.cout));
  const ascenseur = -h.ascenseurTtc / (1 + h.tvaConstruction);
  const amenagementsCommuns = -h.amenagementsCommuns;
  const amenagementsFacades = -h.amenagementsFacades;
  const amenagementTemoin = -h.amenagementTemoin;
  const coutAutres = ascenseur + amenagementsCommuns + amenagementsFacades + amenagementTemoin;
  return {
    lignes,
    superficieTotale: sum(lignes.map((l) => l.superficie)),
    coutBatiment,
    ascenseur,
    amenagementsCommuns,
    amenagementsFacades,
    amenagementTemoin,
    coutAutres,
    total: coutBatiment + coutAutres,
  };
}

function computeAutorisations(constructionsTotal: number, h: Hypotheses) {
  const etudes = h.tauxEtudes * constructionsTotal;
  const suiviChantier = -h.suiviChantierParMois * h.dureeChantierMois;
  const fraisCommune = -h.fraisCommune;
  return {
    etudes,
    suiviChantier,
    fraisCommune,
    total: etudes + suiviChantier + fraisCommune,
  };
}

function computeChargesFinancieres(
  constructionsTotal: number,
  autorisationsTotal: number,
  achatTerrain: number,
  h: Hypotheses,
) {
  const interets =
    (constructionsTotal + autorisationsTotal) * h.tauxChargesFinancieres * h.dureeProjetAnnees;
  const fraisOuvertureCompte = -h.fraisOuvertureCompte;
  const hypotheque = achatTerrain * h.tauxHypotheque;
  return {
    interets,
    fraisOuvertureCompte,
    hypotheque,
    total: interets + fraisOuvertureCompte + hypotheque,
  };
}

function computeChargesVente(totalVentes: number, h: Hypotheses) {
  const compteurGeneral = -h.compteurGeneral;
  const eclatementTitres = -h.tauxEclatementTitres * totalVentes;
  const imprevus = -h.tauxImprevus * totalVentes;
  return {
    compteurGeneral,
    eclatementTitres,
    imprevus,
    total: compteurGeneral + eclatementTitres + imprevus,
  };
}

export interface SimulateOptions {
  /**
   * Si true, reproduit la formule de "Total charges" du fichier Excel source
   * qui omet le poste "Suivi de chantier". Utile pour valider la parité avec
   * le pro forma d'origine. Par défaut false : tous les postes sont inclus.
   */
  legacyExcelTotalCharges?: boolean;
}

export function simulate(
  input: SimulationInput,
  options: SimulateOptions = {},
): SimulationOutput {
  const { terrain, ventes, constructions, hypotheses: h } = input;

  const ca = computeCa(ventes, h.tvaVente);
  const acquisition = computeAcquisition(
    terrain.surface,
    terrain.prixTerrainDhParM2,
    h.tauxEnregistrement,
    h.notaireForfait,
  );
  const constructionsBlock = computeConstructions(constructions, h);
  const autorisations = computeAutorisations(constructionsBlock.total, h);
  const chargesFinancieres = computeChargesFinancieres(
    constructionsBlock.total,
    autorisations.total,
    acquisition.achatTerrain,
    h,
  );
  const chargesVente = computeChargesVente(ca.total, h);

  const totalVentes = ca.total;
  const totalCharges = options.legacyExcelTotalCharges
    ? constructionsBlock.total +
      acquisition.total +
      autorisations.etudes +
      autorisations.fraisCommune +
      chargesFinancieres.total +
      chargesVente.total
    : constructionsBlock.total +
      acquisition.total +
      autorisations.total +
      chargesFinancieres.total +
      chargesVente.total;

  const ebit = totalVentes + totalCharges;
  const is = -ebit * h.tauxIs;
  const resultatNet = ebit + is;
  const margeNette = totalVentes === 0 ? 0 : resultatNet / totalVentes;
  const roe = acquisition.total === 0 ? 0 : -resultatNet / acquisition.total;

  return {
    ca,
    acquisition,
    autorisations,
    constructions: constructionsBlock,
    chargesFinancieres,
    chargesVente,
    totaux: {
      totalVentes,
      totalCharges,
      ebit,
      is,
      resultatNet,
      margeNette,
      roe,
    },
  };
}
