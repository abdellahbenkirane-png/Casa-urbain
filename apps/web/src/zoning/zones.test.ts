import { describe, expect, it } from "vitest";
import { AUTRE_COLOR, FAMILLE_COLORS, FAMILLE_LABELS, baseZoneCode, familleOf, getZone } from "./zones";

describe("zones", () => {
  it("retrouve une zone documentée par son code exact", () => {
    expect(getZone("B5")?.parametres.nombreEtagesMax).toBe(5);
    expect(getZone("D1s2")?.famille).toBe("D");
  });

  it("rattache un sous-secteur AUC à sa zone mère", () => {
    expect(baseZoneCode("C4s")).toBe("C4");
    expect(baseZoneCode("B4a")).toBe("B4");
    expect(getZone("C4s")?.code).toBe("C4");
  });

  it("ne rattache pas un code inconnu ou sans zone mère documentée", () => {
    expect(baseZoneCode("ZUG")).toBeUndefined();
    expect(baseZoneCode("E1sr")).toBeUndefined(); // E1 n'est pas documentée
    expect(getZone("Quartier Gautier : Hmax 23,50m")).toBeUndefined();
  });

  it("déduit la famille, y compris pour les préfixes à deux lettres", () => {
    expect(familleOf("B5")).toBe("B");
    expect(familleOf("PU2")).toBe("PU");
    expect(familleOf("PB")).toBe("PB");
    expect(familleOf("ZR")).toBe("ZR");
    expect(familleOf("C4s")).toBe("C");
    expect(familleOf("ZUG")).toBe("Z"); // famille inconnue → « Autres zones »
  });

  it("a une couleur et un libellé pour chaque famille de la légende", () => {
    for (const f of Object.keys(FAMILLE_COLORS)) {
      expect(FAMILLE_LABELS[f]?.nom).toBeTruthy();
    }
    expect(FAMILLE_COLORS.Z).toBeUndefined();
    expect(AUTRE_COLOR).toMatch(/^#/);
  });
});
