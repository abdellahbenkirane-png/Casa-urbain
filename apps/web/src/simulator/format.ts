export const fmtDh = (n: number) =>
  `${Math.round(n).toLocaleString("fr-FR")} DH`;
export const fmtDhSigned = (n: number) =>
  `${n < 0 ? "−" : "+"}${Math.abs(Math.round(n)).toLocaleString("fr-FR")}`;
// Format français : virgule décimale et vrai signe moins (−), comme fmtDhShort.
const frNum = (n: number, digits: number) =>
  Math.abs(n).toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
export const fmtPct = (n: number, digits = 1) =>
  `${n < 0 ? "−" : ""}${frNum(n * 100, digits)} %`;
export const fmtPctSigned = (n: number, digits = 1) =>
  `${n < 0 ? "−" : "+"}${frNum(n * 100, digits)} %`;
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
