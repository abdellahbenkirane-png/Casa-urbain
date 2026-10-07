import { familleOf, getZone, type Zone } from "../zoning/zones";

/**
 * Valeurs par défaut d'un scénario selon la zone sélectionnée.
 *
 * Deux sources :
 *  - le règlement (pau-zones.json) : étages max, COS, surface minimale,
 *    usages autorisés / interdits, mixité sociale → données factuelles ;
 *  - le tableau MARCHE ci-dessous : prix de terrain, de vente et coûts de
 *    construction par famille → ESTIMATIONS à remplacer par des références
 *    marché réelles. C'est le seul endroit à modifier pour recaler les prix.
 */

export type Programme = "collectif" | "villa" | "tertiaire";

interface Marche {
  /** Prix d'achat du terrain, DH/m² */
  terrain: number;
  /** Prix de vente du produit principal (appartement, villa, bureau), DH TTC/m² */
  vente: number;
  /** Prix de vente des commerces en RDC, DH TTC/m² */
  commerce: number;
}

// ⚠️ Estimations indicatives, non issues d'une étude de marché.
const MARCHE: Record<string, Marche> = {
  A: { terrain: 23000, vente: 22000, commerce: 32000 },
  B: { terrain: 18000, vente: 20000, commerce: 30000 },
  C: { terrain: 16000, vente: 18000, commerce: 26000 },
  D: { terrain: 10000, vente: 28000, commerce: 0 },
  E: { terrain: 12000, vente: 14000, commerce: 20000 },
  I: { terrain: 8000, vente: 16000, commerce: 22000 },
  PB: { terrain: 14000, vente: 18000, commerce: 26000 },
  PU: { terrain: 17000, vente: 20000, commerce: 30000 },
  S: { terrain: 10000, vente: 12000, commerce: 18000 },
  ZR: { terrain: 11000, vente: 14000, commerce: 20000 },
};
const MARCHE_AUTRE: Marche = { terrain: 15000, vente: 18000, commerce: 26000 };

// Coûts de construction HT (DH/m²) — mêmes ordres de grandeur que le pro forma source.
const COUT = {
  sousSolRdc: 1700,
  etages: 3800,
  villa: 4500,
  tertiaire: 4000,
};

export const marcheOf = (code: string): Marche => MARCHE[familleOf(code)] ?? MARCHE_AUTRE;
export const prixTerrainOf = (code: string): number => marcheOf(code).terrain;

/** Programme type selon les usages autorisés par le règlement. */
export function programmeOf(code: string): Programme {
  const zone = getZone(code);
  const famille = familleOf(code);
  if (famille === "D") return "villa";
  if (famille === "I") return "tertiaire";
  const autorises = zone?.usagesAutorises.join(" ").toLowerCase() ?? "";
  if (zone && !autorises.includes("collectif") && autorises.includes("individuel")) return "villa";
  return "collectif";
}

/**
 * Hauteur max lisible dans certains noms de secteurs AUC,
 * ex. « Quartier Gautier : Hmax 23,50m ».
 */
function hauteurDepuisCode(code: string): number | null {
  const m = /hmax\s*([\d]+(?:[.,]\d+)?)\s*m/i.exec(code);
  return m ? Number(m[1]!.replace(",", ".")) : null;
}

/** RDC ≈ 5,5 m, étages courants ≈ 3 m (calé sur A6 23,5 m = R+6, B3 14,5 m = R+3). */
const etagesPourHauteur = (h: number) => Math.max(1, Math.round((h - 5.5) / 3));

// Étages par défaut quand le règlement ne fixe pas de maximum (étages au-dessus du RDC).
const ETAGES_FAMILLE: Record<string, number> = {
  D: 1,
  E: 2,
  I: 2,
  PB: 2,
  S: 1,
};
const ETAGES_ZONE: Record<string, number> = {
  E2: 1, // « secteur existant R+1 »
  E3: 3, // « R+2/R+3 »
};

export function etagesOf(code: string, zone: Zone | undefined = getZone(code)): number {
  const p = zone?.parametres;
  if (p?.nombreEtagesMax != null && p.nombreEtagesMax > 0) return p.nombreEtagesMax;
  if (ETAGES_ZONE[code] != null) return ETAGES_ZONE[code]!;
  const h = p?.hauteurMaxM ?? hauteurDepuisCode(code);
  if (h != null) return etagesPourHauteur(h);
  return ETAGES_FAMILLE[familleOf(code)] ?? 4;
}

/** Surface de terrain type : 500 m², relevée au minimum réglementaire si besoin. */
export function surfaceParDefaut(code: string): number {
  const min = getZone(code)?.parametres.surfaceMinParcelleM2 ?? 0;
  return Math.max(500, min);
}

/** Les commerces sont-ils permis en RDC ? */
function commerceAutorise(zone: Zone | undefined): boolean {
  if (!zone) return true;
  if (zone.usagesInterdits.some((u) => u.trim().toLowerCase() === "commerce")) return false;
  return zone.usagesAutorises.some((u) => /commerce/i.test(u));
}

/** Phrase courte affichée sous « Votre projet ». */
export function resumeProgramme(code: string): string {
  const zone = getZone(code);
  const etages = etagesOf(code, zone);
  const prog = programmeOf(code);
  const mixite = zone?.parametres.mixiteSocialePct;
  if (prog === "villa") return `Villa R+${etages}, conformément au règlement (habitat individuel).`;
  if (prog === "tertiaire") return `Immeuble de bureaux R+${etages}${commerceAutorise(zone) ? " avec commerces en RDC" : ""}.`;
  const parts = [`Immeuble R+${etages}`];
  if (commerceAutorise(zone)) parts.push("commerces en RDC");
  if (mixite) parts.push(`${Math.round(mixite * 100)} % de petites unités (< 100 m²)`);
  return parts.join(", ") + ".";
}

export interface ProgrammeDefaut {
  etages: number;
  ventes: { libelle: string; prixTtcDhParM2: number; superficieVendable: number }[];
  constructions: { libelle: string; prixHtDhParM2: number; superficieConstruite: number }[];
  /** Ajustements d'hypothèses propres au programme (ascenseur, durée…). */
  hypotheses: { ascenseurTtc?: number; amenagementsCommuns?: number; dureeChantierMois?: number };
}

/**
 * Programme type pour une surface de terrain donnée.
 *
 * Surface plancher :
 *  - COS du PAU (par niveau) × niveaux quand il est fixé ;
 *  - sinon emprise type × niveaux (collectif 70 %, villa 40 % — 50 % en
 *    bande (D1) —, tertiaire 50 %).
 * Surface vendable ≈ 85 % de la surface plancher (parties communes déduites),
 * 100 % pour une villa.
 */
export function programmeDefaut(code: string, surfaceTerrain: number): ProgrammeDefaut {
  const zone = getZone(code);
  const etages = etagesOf(code, zone);
  const niveaux = etages + 1;
  const prog = programmeOf(code);
  const m = marcheOf(code);
  const cos = zone?.parametres.cos ?? null;
  const r = Math.round;

  if (prog === "villa") {
    const emprise = code === "D1" ? 0.5 : 0.4;
    const plancher = surfaceTerrain * emprise * niveaux;
    return {
      etages,
      ventes: [{ libelle: "Villa", prixTtcDhParM2: m.vente, superficieVendable: r(plancher) }],
      constructions: [{ libelle: "Villa", prixHtDhParM2: COUT.villa, superficieConstruite: r(plancher) }],
      hypotheses: { ascenseurTtc: 0, amenagementsCommuns: 0, dureeChantierMois: 10 },
    };
  }

  const emprise = prog === "tertiaire" ? 0.5 : 0.7;
  const plancher = surfaceTerrain * (cos ?? emprise) * niveaux;
  const vendable = plancher * 0.85;
  const commerce = commerceAutorise(zone);
  // Commerce : RDC uniquement, au plus 30 % du vendable et l'emprise au sol.
  const surfaceCommerce = commerce ? Math.min(vendable * 0.3, surfaceTerrain * emprise) : 0;
  const surfacePrincipale = Math.max(0, vendable - surfaceCommerce);
  const rdc = surfaceTerrain * emprise;

  const ventes: ProgrammeDefaut["ventes"] = [];
  if (prog === "tertiaire") {
    ventes.push({ libelle: "Bureaux", prixTtcDhParM2: m.vente, superficieVendable: r(surfacePrincipale) });
  } else {
    const mixite = zone?.parametres.mixiteSocialePct ?? 0;
    // « Mixité sociale 70 %, petites unités < 100 m² » : contrainte de taille
    // de logement, pas de prix plafonné → même prix au m² par défaut, sur une
    // ligne à part pour pouvoir l'ajuster.
    if (mixite > 0) {
      ventes.push({
        libelle: `Petites unités < 100 m² (mixité ${Math.round(mixite * 100)} %)`,
        prixTtcDhParM2: m.vente,
        superficieVendable: r(surfacePrincipale * mixite),
      });
    }
    ventes.push({
      libelle: "Appartements",
      prixTtcDhParM2: m.vente,
      superficieVendable: r(surfacePrincipale * (1 - mixite)),
    });
  }
  if (surfaceCommerce > 0) {
    ventes.push({ libelle: "Local commercial RDC", prixTtcDhParM2: m.commerce, superficieVendable: r(surfaceCommerce) });
  }
  // Ordre : produit principal d'abord (c'est lui que « Votre projet » expose).
  ventes.sort((a, b) => Number(/petites/i.test(a.libelle)) - Number(/petites/i.test(b.libelle)));

  const constructions =
    prog === "tertiaire"
      ? [{ libelle: "Bâtiment tertiaire", prixHtDhParM2: COUT.tertiaire, superficieConstruite: r(plancher) }]
      : [
          { libelle: "Sous-sol et RDC", prixHtDhParM2: COUT.sousSolRdc, superficieConstruite: r(rdc + surfaceTerrain * 0.7) },
          { libelle: "Étages courants", prixHtDhParM2: COUT.etages, superficieConstruite: r(Math.max(0, plancher - rdc)) },
        ];

  return {
    etages,
    ventes,
    constructions,
    hypotheses: {
      // Pas d'ascenseur en dessous de R+3 ; chantier plus long au-delà de R+4.
      ascenseurTtc: etages >= 3 ? undefined : 0,
      dureeChantierMois: 12 + Math.max(0, etages - 4) * 2,
    },
  };
}
