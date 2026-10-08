import { describe, expect, it } from "vitest";
import { simulate } from "@casa/core";
import { buildInitialScenario } from "./buildInitial";
import {
  etagesOf,
  prixTerrainOf,
  programmeDefaut,
  programmeOf,
  resumeProgramme,
  surfaceParDefaut,
} from "./zoneProfiles";
import { validate } from "./zoneValidation";

const parcelle = (zone: string) => ({
  id: "AUC-TEST",
  adresse: "test",
  zone,
  surface: surfaceParDefaut(zone),
  prixTerrainMedianDhM2: prixTerrainOf(zone),
});

describe("programme par zone", () => {
  it("choisit villa en zone D, bureaux en zone I, immeuble ailleurs", () => {
    expect(programmeOf("D3")).toBe("villa");
    expect(programmeOf("I3")).toBe("tertiaire");
    expect(programmeOf("B5")).toBe("collectif");
    expect(programmeOf("ZUG")).toBe("collectif");
  });

  it("prend le nombre d'étages maximum du règlement", () => {
    expect(etagesOf("A6")).toBe(6);
    expect(etagesOf("B3")).toBe(3);
    expect(etagesOf("C4s")).toBe(4); // via la zone mère C4
  });

  it("déduit les étages d'une hauteur max lue dans le nom du secteur", () => {
    expect(etagesOf("Quartier Gautier : Hmax 23,50m")).toBe(6);
    expect(etagesOf("Quartier Lusitania : Hmax 17,50m")).toBe(4);
  });

  it("relève la surface par défaut au minimum réglementaire", () => {
    expect(surfaceParDefaut("B5")).toBe(500);
    expect(surfaceParDefaut("D4")).toBe(1000);
    expect(surfaceParDefaut("I5")).toBe(1000);
  });

  it("ne met pas de commerces là où ils sont interdits", () => {
    const d4 = programmeDefaut("D4", 1000);
    expect(d4.ventes.map((v) => v.libelle)).toEqual(["Villa"]);
    const b5 = programmeDefaut("B5", 500);
    expect(b5.ventes.some((v) => /commercial/i.test(v.libelle))).toBe(true);
  });

  it("ajoute la ligne « petites unités » en zone à mixité 70 %", () => {
    const a6 = programmeDefaut("A6", 500);
    const petites = a6.ventes.find((v) => /petites unités/i.test(v.libelle));
    const apparts = a6.ventes.find((v) => v.libelle === "Appartements");
    expect(petites).toBeDefined();
    expect(apparts).toBeDefined();
    // 70 % / 30 % de la surface de logement
    expect(petites!.superficieVendable / (petites!.superficieVendable + apparts!.superficieVendable)).toBeCloseTo(0.7, 1);
  });

  it("supprime l'ascenseur sous R+3", () => {
    expect(programmeDefaut("E2", 500).hypotheses.ascenseurTtc).toBe(0);
    expect(programmeDefaut("B5", 500).hypotheses.ascenseurTtc).toBeUndefined();
  });

  it("résume le programme en une phrase", () => {
    expect(resumeProgramme("D3")).toMatch(/^Villa R\+1/);
    expect(resumeProgramme("A6")).toMatch(/70 % de petites unités/);
  });
});

describe("scénario par défaut", () => {
  const zones = ["A6", "B3", "B5", "C4", "D1", "D3", "D4", "E2", "E3", "E4", "I3", "I5", "PB", "PU1", "S4", "ZR", "ZUG", "C4s"];

  it.each(zones)("%s : programme conforme au règlement", (zone) => {
    const input = buildInitialScenario(parcelle(zone));
    expect(validate(input, zone).filter((v) => v.severity === "error")).toEqual([]);
  });

  it.each(zones)("%s : résultat chiffré sans NaN ni infini", (zone) => {
    const r = simulate(buildInitialScenario(parcelle(zone)));
    for (const v of [r.totaux.totalVentes, r.totaux.totalCharges, r.totaux.resultatNet, r.totaux.margeNette]) {
      expect(Number.isFinite(v)).toBe(true);
    }
  });
});

describe("conformité", () => {
  it("signale un immeuble d'appartements en zone villas", () => {
    const input = buildInitialScenario(parcelle("B5")); // programme d'immeuble
    const v = validate(input, "D3");
    expect(v.some((x) => /habitat collectif/i.test(x.message))).toBe(true);
  });

  it("signale un terrain sous la surface minimale", () => {
    const input = buildInitialScenario({ ...parcelle("D4"), surface: 400 });
    expect(validate(input, "D4").some((x) => x.field === "terrain.surface")).toBe(true);
  });

  it("signale un dépassement du nombre d'étages", () => {
    const input = buildInitialScenario(parcelle("B3"));
    input.terrain.nombreEtages = 6;
    expect(validate(input, "B3").some((x) => x.field === "terrain.nombreEtages")).toBe(true);
  });
});

describe("règlements par arrondissement (fiches AUC)", async () => {
  const data = (await import("../../../../data/reglement/auc-arrondissements.json")).default as unknown as {
    arrondissements: Record<string, { zones: Record<string, { famille: string; parametres: Record<string, unknown> }> }>;
  };
  const { FAMILLE_COLORS } = await import("../zoning/zones");
  const cas = Object.entries(data.arrondissements).flatMap(([arr, a]) =>
    Object.keys(a.zones).map((code) => [arr, code] as const),
  );

  it("couvre les 16 arrondissements de la ville (Aïn Chock : référentiel) et les communes", () => {
    const noms = Object.keys(data.arrondissements);
    expect(noms.filter((n) => !n.startsWith("Commune ") || n === "Commune Mechouar")).toHaveLength(16);
    expect(noms).toEqual(expect.arrayContaining(["Commune Bouskoura", "Commune Dar Bouazza", "Commune Mohammedia"]));
  });

  it.each(cas)("%s / %s : famille connue, scénario chiffré sans NaN", (arr, code) => {
    expect(FAMILLE_COLORS[data.arrondissements[arr]!.zones[code]!.famille]).toBeDefined();
    const p = { id: "T", adresse: "t", zone: code, arrondissement: arr,
      surface: surfaceParDefaut(code, arr), prixTerrainMedianDhM2: prixTerrainOf(code, arr) };
    const r = simulate(buildInitialScenario(p));
    expect(Number.isFinite(r.totaux.resultatNet)).toBe(true);
  });
});
