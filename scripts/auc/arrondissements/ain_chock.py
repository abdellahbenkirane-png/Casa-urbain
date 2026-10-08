# Plan d'aménagement de l'arrondissement d'Aïn Chock — fiches de zone (auc.ma).
# Remplace, pour cet arrondissement, le référentiel historique pau-zones.json,
# où les COS « sans lotissement » étaient appliqués par niveau.
from commun import *

NOM = "Ain Chock"
DOCUMENT = "PA de l'arrondissement d'Aïn Chock (AUC)"
PDF = "https://www.auc.ma"

A_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES, "opérations de logement social"]
B_INT = [INDUSTRIE, DEPOTS, PROVISOIRE, MORCELLEMENT, CARRIERES, "caves liées aux logements en RDC"]
C_INT = ["établissements industriels et dépôts (toute nature)", PROVISOIRE, DEPOTS, CARRIERES, "caves liées aux logements en RDC"]
D_INT = [INDUSTRIE, DEPOTS, PROVISOIRE, MORCELLEMENT, CARRIERES, "mezzanines"]
E_INT = [INDUSTRIE, DEPOTS, PROVISOIRE, CARRIERES, "caves liées aux logements en RDC"]
I_INT = [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE]
I_INT_5 = [INDUSTRIE, "logements (hors gardiennage)", CARRIERES, PROVISOIRE]
I_AUT = ["tertiaire", "commerce", "bureaux", "enseignement", "recherche"]
SOCIAL = "Logements sociaux : 60 % des unités au plus."
I_NOTE = "Recul de 5 m sur voie. Hauteur sous plafond 3,50 m (5,50 m en RDC)."


def b(code, h, etages, surface, cos, cus, recul=False):
    return zone(code, "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=h, etages=etages, surface=surface, facade=12,
                remarque=" ".join(x for x in [
                    "Recul de 4 m sur voie, traité en jardin." if recul else "Implantation à l'alignement.",
                    sans_lotissement(cos, cus), "Lotissements : 10 lots au plus.", SOCIAL] if x),
                article="zone B, art. 28-34")


def c(code, cos, cus, h, etages, extra=None):
    return zone(code, "C", "Immeubles sur espaces verts", DEF_C, AUT_C, C_INT, h=h, etages=etages,
                surface=5000, facade=40, cos=cos, cus=cus,
                remarque=" ".join(x for x in [extra, "Recul de 4 m sur voie.", SOCIAL] if x), article="zone C, art. 35-39")


def d(code, surface, facade, cus, detail, terrasse=True):
    return zone(code, "D", "Villas", DEF_D, AUT_D, D_INT + ([] if terrasse else ["accès à la terrasse"]),
                h=8.5, etages=1, surface=surface, facade=facade, cus=cus,
                remarque=f"{detail} Linéaire de commerce et service : 11,50 m (R+2). Villégiature : 10 000 m² / 60 m, 18 unités/ha.",
                article="zone D, art. 42-48")


def e(code, h, etages, surface, facade, cus=None, cos=None, sl=None, extra=None):
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages, surface=surface,
                facade=facade, cus=cus, cos=cos,
                remarque=" ".join(x for x in [
                    "RDC commercial : emprise jusqu'à 100 %." if code in ("E2", "E3") else None,
                    sans_lotissement(*sl) if sl else None, extra,
                    "Fronts bâtis FB3 (14,50 m) et FB4 (17,50 m) le long de certains axes.", SOCIAL] if x),
                article="zone E, art. 49-53")


def i(code, nom, aut, interdits, h, etages, surface, facade, cus, extra=None):
    return zone(code, "I", nom, "Zone d'activités économiques : industrie, artisanat, tertiaire, commerce, enseignement.",
                aut, interdits, h=h, etages=etages, surface=surface, facade=facade, cus=cus,
                remarque=" ".join(x for x in [extra, I_NOTE] if x), article="zone I, art. 70-74")


ZONES = [
    zone("A6", "A", "Immeubles haute densité", DEF_A, AUT_A, A_INT, h=23.5, etages=6, surface=400, facade=18,
         remarque="Hôtels et bureaux : 30 m (R+8). Ni COS ni emprise fixés. Mixité sociale : 70 % au plus de la typologie dominante.",
         article="zone A, art. 21-25"),
    b("B3", 14.5, 3, 250, 1.2, 0.35),
    b("B3s", 14.5, 3, 300, 1.2, 0.35, recul=True),
    b("B4", 17.5, 4, 250, 1.3, 0.30),
    b("B4s", 17.5, 4, 300, 1.3, 0.30, recul=True),
    b("B5", 20.5, 5, 300, 1.4, 0.25),
    c("C3", 1.2, 0.35, 14.5, 3),
    c("C3S2", 1.2, 0.35, 14.5, 3, "Opérations : 60 % de type C3 et 40 % de type C2 (R+2, COS 1, emprise 40 %)."),
    c("C4s", 1.3, 0.30, 17.5, 4, "Opérations mixtes (commerces, tertiaire, hôtellerie) encouragées le long de l'autoroute urbaine."),
    c("C5s", 1.4, 0.25, 20.5, 5, "Ensembles de type C3s ou C4s possibles."),
    d("D1", 200, 10, 0.5, "Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %)."),
    d("D1s2", 160, 10, 0.5, "Villas en bande 160 m² / 10 m (emprise 50 %).", terrasse=False),
    d("D3", 600, 22, 0.35, "Villas isolées 600 m² / 22 m (emprise 35 %).", terrasse=False),
    d("D4", 1000, 25, 0.25, "Villas isolées 1 000 m² / 25 m (emprise 25 %). Recul de 5 m.", terrasse=False),
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.45), extra="Un 3e étage possible le long des voies ≥ 12 m."),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    i("I2s1", "Activités industrielles", ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"], I_INT, 20.5, 4, 500, 20, None,
      extra="Emprise au sol non fixée."),
    i("I3", "Petite industrie", ["industrie 3e catégorie", "artisanat"],
      ["établissements industriels de 1re et 2e catégorie", "logements (un par lot)", CARRIERES, PROVISOIRE], 14.5, 3, 360, 12, 0.6),
    i("I5", "Activités & bureaux", I_AUT, I_INT_5, 17.5, 3, 1000, 30, 0.5),
    i("I5s5", "Activités & bureaux", I_AUT + ["industrie non nuisante"], I_INT_5, 25, 5, 1000, 30, 0.5),
    i("I5s7", "Activités & bureaux", I_AUT, I_INT_5, 32.5, 7, 1000, 30, 0.5),
    i("I5s10", "Activités & bureaux", I_AUT, I_INT_5, 43.5, 10, 5000, 30, 0.2, extra="Bureaux : 43,50 m (R+10)."),
    i("I5H", "Activités & bureaux", I_AUT + ["hôtellerie", "équipements"], I_INT_5, 17.5, 3, 1000, 30, 0.5,
      extra="Bureaux : 28,50 m (R+6) ; hôtels : 36 m (R+8)."),
    i("I8s", "Parc logistique", ["logistique", "tertiaire", "commerce", "équipements"], I_INT, 17.5, 3, 5000, 40, 0.5),
    zone("PBC4", "PB", "Bande verte — immeubles",
         "Transition entre bâti et espace naturel : un tiers de la parcelle reste en bande verte publique, les deux tiers en îlots ouverts.",
         AUT_C, C_INT, h=17.5, etages=4, surface=10000, facade=60, cos=1.3, cus=0.3,
         remarque="Emprise calculée sur les deux tiers constructibles. Recul de 4 m sur voie, 8 m face à la bande verte.",
         article="zone PB, art. 56-60"),
    zone("PBC5", "PB", "Bande verte — immeubles",
         "Transition entre bâti et espace naturel : un tiers de la parcelle reste en bande verte publique, les deux tiers en îlots ouverts.",
         AUT_C, C_INT, h=20.5, etages=5, surface=10000, facade=60, cos=1.8, cus=0.3,
         remarque="Emprise calculée sur les deux tiers constructibles. Recul de 4 m sur voie, 8 m face à la bande verte.",
         article="zone PB, art. 56-60"),
    zone("S4", "S", "Habitat traditionnel (protégé)",
         "Ensemble urbain remarquable d'habitat traditionnel et d'artisanat, soumis à une charte architecturale.",
         ["habitat traditionnel", "artisanat", "commerce de proximité"],
         ["établissements industriels et classés", "dépôts et entrepôts > 500 m²", CARRIERES],
         h=8, etages=1, remarque="Ni COS, ni emprise, ni surface minimale. Construction jusqu'aux limites mitoyennes.",
         article="zone S4, art. 64-69"),
    zone("PU1", "PU", "Projet urbain — nœud A", "Secteur stratégique d'environ 9,7 ha (RN1 / route des facultés), projet intégré.",
         ["projet urbain approuvé"], ["construction hors projet approuvé"], article="zone PU, art. 77"),
    zone("PU2", "PU", "Projet urbain — club Kahrama", "Centralité verte de 14 ha ; seules des structures légères sont admises.",
         ["projet urbain approuvé"], ["construction hors projet approuvé"], article="zone PU, art. 77"),
    zone("PU3", "PU", "Projet urbain — SNRT", "Centralité de 9 ha sur le site de la SNRT, bâtisses patrimoniales à préserver.",
         ["projet urbain approuvé"], ["construction hors projet approuvé"], article="zone PU, art. 77"),
    *zones_naturelles(zone, article="zone ZR, art. 63", codes=("ZR",)),
]
