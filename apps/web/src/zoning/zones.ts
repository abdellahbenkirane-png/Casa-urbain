import zonesData from "../../../../data/reglement/pau-zones.json";

export interface ZoneParametres {
  cos: number;
  cus: number;
  hauteurMaxM: number;
  nombreEtagesMax: number;
  retraitFacadeM: number;
  retraitFondM: number;
  emprisAuSolMaxPct: number;
}

export interface Zone {
  code: string;
  nom: string;
  description: string;
  usagesAutorises: string[];
  usagesInterdits: string[];
  parametres: ZoneParametres;
}

const ZONES = (zonesData as { zones: Record<string, Zone> }).zones;

export const getZone = (code: string): Zone | undefined => ZONES[code];
export const allZones = (): Zone[] => Object.values(ZONES);
