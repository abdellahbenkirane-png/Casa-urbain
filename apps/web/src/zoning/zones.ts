import zonesData from "../../../../data/reglement/pau-zones.json";
import arrondissementsData from "../../../../data/reglement/auc-arrondissements.json";

export interface ZoneParametres {
  cos?: number | null;
  cus?: number | null;
  /** COS applicable à la parcelle : surface de plancher totale / surface du terrain. */
  cosGlobal?: number | null;
  hauteurMaxM?: number | null;
  nombreEtagesMax?: number | null;
  hauteurHotelBureauM?: number | null;
  etagesHotelBureau?: number | null;
  surfaceMinParcelleM2?: number | null;
  facadeMinM?: number | null;
  linealFacadeMinPct?: number | null;
  mixiteSocialePct?: number | null;
  designation?: string | null;
  /** Document d'urbanisme d'où proviennent les règles. */
  source?: string | null;
  fichePdf?: string | null;
  remarque?: string | null;
}

export interface Zone {
  code: string;
  famille?: string;
  nom: string;
  description: string;
  usagesAutorises: string[];
  usagesInterdits: string[];
  parametres: ZoneParametres;
  fichePages?: string[];
}

const ZONES = (zonesData as { zones: Record<string, Zone> }).zones;

// Règlements propres à chaque arrondissement de Casablanca (fiches de zone
// des plans d'aménagement AUC). Un même code (« B5 ») n'a pas les mêmes
// règles d'un arrondissement à l'autre : ils priment sur ZONES, qui sert de
// repli (règles d'Aïn Chock).
type Arrondissement = {
  document: string;
  pdf: string;
  zones: Record<string, Zone>;
  /** Motif de secteur AUC → code de zone (« ^Quartier » → « ZUG » à Sidi Belyout). */
  alias?: Record<string, string>;
};

/** « Arrondissement Moulay R'Chid » → « moulayrchid » (clé de correspondance). */
export function arrKey(commune: string | undefined): string | undefined {
  if (!commune) return undefined;
  return commune
    .replace(/^\s*(arrondissement|commune)\s+/i, "")
    .normalize("NFD")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase() || undefined;
}

const ARRONDISSEMENTS: Record<string, Arrondissement> = Object.fromEntries(
  Object.entries(
    (arrondissementsData as unknown as { arrondissements: Record<string, Arrondissement> }).arrondissements,
  ).map(([nom, a]) => [arrKey(nom)!, a]),
);

const arrondissement = (arr?: string) => {
  const k = arrKey(arr);
  return k ? ARRONDISSEMENTS[k] : undefined;
};
const zonesLocales = (arr?: string) => arrondissement(arr)?.zones;

/** L'arrondissement a-t-il son propre règlement intégré ? */
export const hasReglementLocal = (arr?: string): boolean => zonesLocales(arr) != null;

/**
 * Code de zone documenté le plus proche : le code exact, sinon la zone mère
 * d'un sous-secteur AUC (« C4s » → « C4 », « B4a » → « B4 »). Les secteurs
 * de l'arrondissement passent avant ceux du référentiel général.
 */
export function baseZoneCode(code: string, arr?: string): string | undefined {
  const locales = zonesLocales(arr);
  const c = code.trim();
  if (locales?.[c] || ZONES[c]) return c;
  for (const [motif, cible] of Object.entries(arrondissement(arr)?.alias ?? {})) {
    if (new RegExp(motif).test(c) && locales?.[cible]) return cible;
  }
  const m = /^([A-Z]+\d+)/.exec(c);
  return m && (locales?.[m[1]!] || ZONES[m[1]!]) ? m[1] : undefined;
}

export const getZone = (code: string, arr?: string): Zone | undefined => {
  const base = baseZoneCode(code, arr);
  return base ? (zonesLocales(arr)?.[base] ?? ZONES[base]) : undefined;
};

/** La zone affichée vient-elle du règlement de l'arrondissement ? */
export const isZoneLocale = (code: string, arr?: string): boolean => {
  const base = baseZoneCode(code, arr);
  return base != null && zonesLocales(arr)?.[base] != null;
};
export const allZones = (): Zone[] => Object.values(ZONES);

/**
 * Mapping famille de zone → couleur pour l'affichage cartographique.
 * Teintes choisies pour rester distinctes entre elles sur fond satellite.
 */
export const FAMILLE_COLORS: Record<string, string> = {
  A: "#2563eb",
  B: "#7c3aed",
  C: "#db2777",
  D: "#16a34a",
  E: "#f59e0b",
  I: "#0891b2",
  PB: "#84cc16",
  PU: "#dc2626",
  S: "#a16207",
  ZR: "#475569",
};

/** Secteurs AUC hors des familles ci-dessus (ZUG, RA, TVR, F, G…). */
export const AUTRE_COLOR = "#e4e4e7";

/** Libellés grand public par famille (légende + zones non documentées). */
export const FAMILLE_LABELS: Record<string, { nom: string; description: string }> = {
  A: { nom: "Immeubles haute densité", description: "Habitat collectif dense, commerces, bureaux et hôtels encouragés." },
  B: { nom: "Immeubles collectifs", description: "Immeubles d'habitation de R+3 à R+5, commerces en rez-de-chaussée." },
  C: { nom: "Immeubles sur cour", description: "Habitat collectif organisé autour de cours d'îlots." },
  D: { nom: "Villas", description: "Villas en bande ou isolées, faible densité." },
  E: { nom: "Habitat existant", description: "Quartiers existants de faible hauteur (R+1 à R+3)." },
  I: { nom: "Activités & bureaux", description: "Industrie légère, tertiaire et commerce." },
  PB: { nom: "Bande verte", description: "Espace vert de transition, construction très limitée." },
  PU: { nom: "Projets urbains", description: "Grands projets soumis à un plan d'aménagement spécifique." },
  S: { nom: "Habitat traditionnel", description: "Secteur protégé d'habitat traditionnel." },
  ZR: { nom: "Restructuration", description: "Zone à restructurer, règles fixées par projet." },
};


export const AUTRE_LABEL = {
  nom: "Autres zones",
  description: "Secteur à règlement spécifique, non encore intégré dans le simulateur.",
};

export function familleOf(code: string, arr?: string): string {
  const z = getZone(code, arr);
  if (z?.famille) return z.famille;
  if (/^(PB|PU|ZR)/.test(code)) return code.slice(0, 2);
  return code.charAt(0).toUpperCase();
}
