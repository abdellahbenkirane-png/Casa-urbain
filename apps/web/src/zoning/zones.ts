import zonesData from "../../../../data/reglement/pau-zones.json";

export interface ZoneParametres {
  cos?: number | null;
  cus?: number | null;
  hauteurMaxM?: number | null;
  nombreEtagesMax?: number | null;
  hauteurHotelBureauM?: number | null;
  etagesHotelBureau?: number | null;
  surfaceMinParcelleM2?: number | null;
  facadeMinM?: number | null;
  linealFacadeMinPct?: number | null;
  mixiteSocialePct?: number | null;
  designation?: string | null;
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

export const getZone = (code: string): Zone | undefined => ZONES[code];
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
  ZR: "#94a3b8",
};

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

export function familleOf(code: string): string {
  const z = getZone(code);
  if (z?.famille) return z.famille;
  if (/^(PB|PU|ZR)/.test(code)) return code.slice(0, 2);
  return code.charAt(0).toUpperCase();
}
