# Plan d'aménagement de la commune urbaine de Dar Bouazza — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Dar Bouazza"
DOCUMENT = "PA de la commune de Dar Bouazza (AUC)"
PDF = "https://www.auc.ma"

C_INT = ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", PROVISOIRE, DEPOTS, CARRIERES]
D_INT = [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
BT_DEF = "Zone balnéaire et touristique : résidences secondaires de faible densité, hôtels, loisirs."
BT_AUT = ["résidences balnéaires", "hôtellerie", "loisirs"]
BT_INT = [INDUSTRIE, "dépôts", "artisanat", "bureaux et commerces non liés à la zone", "accès aux terrasses", CARRIERES]
E_NOTE = "Front bâti FB4 (17,50 m) le long de certains axes. Lotissements : 5 % du terrain en espaces libres plantés."


def c(code, cos, cus, surface, facade, h, etages):
    return zone(code, "C", "Immeubles sur espaces verts", DEF_C, AUT_C, C_INT, h=h, etages=etages,
                surface=surface, facade=facade, cos=cos, cus=cus,
                remarque="Recul de 4 m sur voie, égal à la hauteur (8 m min.) en limites séparatives.",
                article="zone C, art. 23-29")


def d(code, surface, facade, cus, detail):
    return zone(code, "D", "Villas", DEF_D, AUT_D, D_INT, h=8, etages=1, surface=surface, facade=facade, cus=cus,
                remarque=f"{detail} Étage limité à 80 % du RDC pour les villas isolées. Recul de 5 m sur voie (4 m en D1 et D2).",
                article="zone D, art. 30-34")


def e(code, h, etages, surface, facade, cus=None, cos=None, sl=None, extra=None):
    note = " ".join(x for x in [
        "RDC commercial : emprise jusqu'à 100 %." if code in ("E2", "E3", "E3s") else None,
        sans_lotissement(*sl) if sl else None, extra, E_NOTE] if x)
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, cos=cos, remarque=note, article="zone E, art. 37-41")


ZONES = [
    zone("A5s", "A", "Immeubles haute densité", DEF_A, AUT_A, [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES],
         h=21, etages=5, surface=400, facade=18,
         remarque="Rez-de-chaussée réservé aux commerces et services. Hôtels et bureaux : 30 m (R+8). Ni COS ni emprise fixés.",
         article="zone A, art. 9-13"),
    zone("BT1", "D", "Résidences balnéaires", BT_DEF, BT_AUT, BT_INT, h=8.5, etages=1, surface=200, facade=10,
         cos=0.6, cus=0.5, remarque="Recul de 4 m sur voie et en limites séparatives.", article="zone BT, art. 16-21"),
    zone("BT2", "C", "Immeubles balnéaires", BT_DEF, BT_AUT, BT_INT, h=11.5, etages=2, surface=5000, facade=40,
         cos=0.8, cus=0.3, remarque="Recul de 4 m sur voie, 6 m en limites séparatives.", article="zone BT, art. 16-21"),
    zone("BT2s1", "C", "Immeubles balnéaires", BT_DEF, BT_AUT, BT_INT, h=11.5, etages=2, surface=5000, facade=40,
         cos=1.1, cus=0.35, remarque="Recul de 4 m sur voie, 6 m en limites séparatives.", article="zone BT, art. 16-21"),
    zone("BT3s", "C", "Immeubles balnéaires", BT_DEF, BT_AUT, BT_INT, h=14.5, etages=3, surface=5000, facade=40,
         cos=1.0, cus=0.3, remarque="Hôtels : 23,50 m (R+6), étages supplémentaires hors COS. Recul de 4 m sur voie, 6 m en limites séparatives.",
         article="zone BT, art. 16-21"),
    c("C2", 1.0, 0.40, 5000, 40, 11.5, 2),
    c("C3", 1.2, 0.35, 5000, 40, 14.5, 3),
    c("C4", 1.3, 0.30, 10000, 60, 17.5, 4),
    d("D1", 200, 10, 0.5, "Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %)."),
    d("D2", 400, 20, 0.35, "Villas isolées 400 m² / 20 m (emprise 35 %)."),
    d("D2s", 400, 20, 0.35, "Villas isolées 400 m² / 20 m (35 %) ; villégiature 10 000 m² / 60 m, 22 unités/ha."),
    d("D3", 600, 22, 0.35, "Villas isolées 600 m² / 22 m (emprise 35 %)."),
    d("D3s", 600, 22, 0.35, "Villas isolées 600 m² / 22 m (35 %) ; villégiature 10 000 m² / 60 m (25 %), 18 unités/ha."),
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.40)),
    e("E2s", 11.5, 2, 60, 6),
    e("E2s3", 11.5, 2, 140, 10, extra="Recul de 3 m sur voie."),
    e("E2s5", 11.5, 2, 60, 6, extra="Un étage de plus pour les parcelles existantes sur voies ≥ 8 m."),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    e("E3s", 14.5, 3, 84, 7),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    e("E4s2", 14.5, 3, 160, 10, 0.85,
      extra="Secteur mixte : immeubles de type E2, E3 ou E4 selon la parcelle (le simulateur part du type E3)."),
    zone("CV", "PB", "Ceinture verte", DEF_CV,
         ["espaces verts", "sports et loisirs", "cimetières", "bassins de retenue", "agriculture"],
         ["habitat", "lotissements", "dépôts et hangars", "industrie", CARRIERES],
         remarque="Zone non constructible pour l'habitat.", article="zone CV, art. 57-61"),
    zone("RA", "PB", "Zone rurale (agricole)",
         "Terrains à vocation strictement agricole : habitat des exploitants et bâtiments agricoles.",
         ["exploitation agricole", "habitat de l'exploitant"],
         ["lotissements et groupes d'habitations", "dépôts et hangars", "industrie", "bureaux et commerces", CARRIERES],
         remarque="Zone agricole : le simulateur d'immeuble ne s'applique pas.", article="zone RA, art. 51-52"),
    zone("RC", "ZR", "Protection du domaine maritime", DEF_RC, [], ["toute construction"],
         remarque="Servitude non aedificandi : aucune construction ni installation.", article="zone RC, art. 65"),
]
