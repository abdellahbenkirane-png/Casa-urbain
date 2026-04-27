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
 */
export const FAMILLE_COLORS: Record<string, string> = {
  A: "#2f81f7",
  B: "#58a6ff",
  C: "#79c0ff",
  D: "#3fb950",
  E: "#a5d6ff",
  I: "#a371f7",
  PB: "#f0883e",
  PU: "#db61a2",
  S: "#d29922",
  ZR: "#8b949e",
};

export function familleOf(code: string): string {
  const z = getZone(code);
  if (z?.famille) return z.famille;
  return code.replace(/[0-9].*$/, "").replace(/[a-z].*$/, "") || code;
}
