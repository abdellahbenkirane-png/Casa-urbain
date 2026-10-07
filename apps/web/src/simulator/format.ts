export const fmtDh = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR")} DH`;
export const fmtDhSigned = (n: number) => {
  const s = Math.round(n).toLocaleString("fr-FR");
  return n < 0 ? s : `+${s}`;
};
export const fmtPct = (n: number, digits = 1) =>
  `${(n * 100).toFixed(digits)} %`;
export const fmtPctSigned = (n: number, digits = 1) => {
  const v = (n * 100).toFixed(digits);
  return n < 0 ? `${v} %` : `+${v} %`;
};
export const fmtM2 = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR")} m²`;
/** Montant compact pour les gros chiffres : « 27,4 M DH », « 850 k DH ». */
export const fmtDhShort = (n: number) => {
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (a >= 1e6) return `${sign}${(a / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M DH`;
  if (a >= 1e4) return `${sign}${Math.round(a / 1e3).toLocaleString("fr-FR")} k DH`;
  return `${sign}${Math.round(a).toLocaleString("fr-FR")} DH`;
};
