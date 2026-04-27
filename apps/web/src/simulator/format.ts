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
