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

describe("règlements par arrondissement", () => {
  const MS = "Arrondissement Mers Sultan";

  it("normalise les noms d'arrondissement AUC", async () => {
    const { arrKey } = await import("./zones");
    expect(arrKey("Arrondissement Moulay R'Chid")).toBe("moulayrchid");
    expect(arrKey("Arrondissement Aïn Chock")).toBe("ainchock");
    expect(arrKey(undefined)).toBeUndefined();
  });

  it("applique les règles de l'arrondissement avant celles d'Aïn Chock", () => {
    // B5 : façade minimale de 12 m à Aïn Chock (référentiel), 14 m à Mers Sultan.
    expect(getZone("B5", MS)?.parametres).toMatchObject({ surfaceMinParcelleM2: 300, facadeMinM: 14 });
    expect(getZone("B5")?.parametres.facadeMinM).toBe(12);
  });

  it("retombe sur le référentiel pour un secteur non documenté", async () => {
    const { isZoneLocale } = await import("./zones");
    expect(isZoneLocale("B5", MS)).toBe(true);
    expect(isZoneLocale("PU1", MS)).toBe(false);
    expect(getZone("PU1", MS)).toBe(getZone("PU1"));
  });

  it("donne une famille aux secteurs propres à l'arrondissement", () => {
    expect(familleOf("AM3", MS)).toBe("B");
    expect(familleOf("ZUG", MS)).toBe("A");
    expect(familleOf("ZUG")).not.toBe("A"); // hors Mers Sultan : non documenté
  });
});

describe("alias de secteurs (Sidi Belyout)", () => {
  it("rattache les quartiers « Hmax » à la zone ZUG, hauteur lue dans le nom", async () => {
    const { etagesOf } = await import("../simulator/zoneProfiles");
    const SB = "Arrondissement Sidi Belyout";
    const q = "Quartier Gautier : Hmax 23,50m";
    expect(getZone(q, SB)?.code).toBe("ZUG");
    expect(etagesOf(q, getZone(q, SB), SB)).toBe(6);
    expect(getZone(q)).toBeUndefined(); // hors Sidi Belyout : pas d'alias
  });
});
