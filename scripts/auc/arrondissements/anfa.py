# Plan d'aménagement de l'arrondissement d'Anfa — fiches de zone (auc.ma).
from commun import *

NOM = "Anfa"
DOCUMENT = "PA de l'arrondissement d'Anfa (AUC)"
PDF = "https://www.auc.ma"

A_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
C_INT = ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", PROVISOIRE, DEPOTS, CARRIERES]
D_INT = [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)",
         "enseignement privé et cliniques (hors linéaire L2)", PROVISOIRE, CARRIERES]
BT_INT = [INDUSTRIE, "dépôts", "bureaux et commerces non liés à la zone", "accès aux terrasses", CARRIERES]
BT_DEF = "Zone balnéaire et touristique : résidences secondaires de faible densité, hôtels, loisirs, commerces liés."
BT_AUT = ["résidences balnéaires", "hôtellerie", "loisirs", "commerce lié à la zone"]
PALAIS = "Hauteurs sous réserve des servitudes autour des Palais et Demeures Royaux."


def a(code, h, etages, surface, facade, h_hotel, etages_hotel):
    return zone(code, "A", "Immeubles haute densité",
                "Secteur mixte dense de forte hauteur : bureaux, commerces, hôtellerie, artisanat et habitat.",
                AUT_A + ["artisanat"], A_INT, h=h, etages=etages, surface=surface, facade=facade,
                remarque=f"Hôtels et bureaux : jusqu'à {str(h_hotel).replace('.', ',')} m (R+{etages_hotel}). Ni COS ni emprise fixés.",
                article="zone A, art. 9-12")


def bt(code, famille, nom, surface, facade, cus, cos, h, etages, remarque=None):
    return zone(code, famille, nom, BT_DEF, BT_AUT, BT_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, cos=cos,
                remarque=" ".join(x for x in [remarque, "Recul de 4 m sur voie.", PALAIS] if x),
                article="zone BT, art. 23-28")


def c(code, cos, cus, surface, facade, h, etages):
    return zone(code, "C", "Immeubles sur espaces verts", DEF_C, AUT_C, C_INT,
                h=h, etages=etages, surface=surface, facade=facade, cos=cos, cus=cus,
                remarque="Recul de 4 m sur voie ; recul égal à la hauteur (8 m min.) en limites séparatives.",
                article="zone C, art. 30-35")


def d(code, surface, facade, cus, detail, terrasse=True):
    return zone(code, "D", "Villas", DEF_D, AUT_D,
                D_INT + (["accès à la terrasse"] if not terrasse else []),
                h=8, etages=1, surface=surface, facade=facade, cus=cus,
                remarque=f"{detail} Cliniques et apparts-hôtels sur linéaire L2 : 11,50 m (R+2). {PALAIS}",
                article="zone D, art. 37-40")


ZONES = [
    a("A7", 26.5, 7, 500, 20, 35.5, 10),
    a("A9s2", 32.5, 9, 600, 22, 41.5, 12),
    zone("B3", "B", "Immeubles collectifs", DEF_B, MIXTE, A_INT, h=14.5, etages=3, surface=250, facade=12,
         remarque="Ni COS ni emprise fixés.", article="zone B, art. 16-19"),
    zone("B5", "B", "Immeubles collectifs", DEF_B, MIXTE, A_INT, h=20.5, etages=5, surface=300, facade=12,
         remarque="Ni COS ni emprise fixés.", article="zone B, art. 16-19"),
    bt("BTr", "PB", "Front de mer (vue préservée)", None, None, 0.5, None, None, None,
       remarque="Constructions limitées à 1 m sous le niveau du trottoir pour préserver la vue sur mer."),
    bt("BTrs", "D", "Résidences balnéaires", 600, 20, 0.5, 0.5, 3.5, None,
       remarque="Hauteur 3,50 m (rez-de-chaussée seul)."),
    bt("BT1s", "D", "Résidences balnéaires", 1000, 30, 0.5, 0.75, 8.5, 1),
    bt("BT2", "C", "Immeubles balnéaires", 5000, 40, 0.3, 0.8, 11.5, 2),
    bt("BT2s2", "C", "Immeubles balnéaires (renouvellement)", 600, 20, None, None, 11.5, 2,
       remarque="Secteur de renouvellement urbain : seules les constructions neuves sont admises."),
    bt("BT3", "C", "Immeubles balnéaires", 5000, 40, 0.3, 1.0, 14.5, 3),
    bt("BT3s1", "C", "Immeubles balnéaires (renouvellement)", 600, 20, None, None, 14.5, 3,
       remarque="Secteur de renouvellement urbain : seules les constructions neuves sont admises."),
    c("C2s1", 0.8, 0.30, 5000, 40, 11.5, 2),
    c("C3", 1.2, 0.35, 5000, 40, 14.5, 3),
    c("C4s1", 0.5, 0.20, 10000, 50, 17.5, 4),
    c("C4", 1.3, 0.30, 10000, 50, 17.5, 4),
    zone("CQS", "PU", "Quartier Sindibad (projet intégré)",
         "Projet intégré : logements collectifs et individuels, îlots tertiaires (hôtels, commerces, bureaux), parc archéologique.",
         ["habitat collectif", "habitat individuel", "hôtellerie", "commerce", "bureaux"],
         ["constructions dans les parties communes", INDUSTRIE, DEPOTS, "accès à la terrasse", PROVISOIRE, CARRIERES],
         remarque="Constructibilité fixée par le cahier des charges du projet Sindibad, par sous-secteur (T1a à T12) : emprise de 31 à 62 %, COS de 0,79 à 2,41.",
         article="zone CQs, art. 44-46"),
    d("D1", 200, 10, 0.5, "Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %)."),
    d("D1s1", 250, 10, 0.5, "Villas en bande 250 m² / 10 m (50 %), jumelées 375 m² / 15 m (40 %), isolées 500 m² / 20 m (40 %)."),
    d("D3", 600, 22, 0.35, "Villas isolées 600 m² / 22 m (emprise 35 %).", terrasse=False),
    d("D3s", 600, 22, 0.35, "Villas isolées 600 m² / 22 m (35 %) ; villégiature 10 000 m² / 60 m, 18 unités/ha.", terrasse=False),
    d("D4", 1000, 25, 0.25, "Villas isolées 1 000 m² / 25 m (emprise 25 %).", terrasse=False),
    d("D4s", 1000, 25, 0.25, "Villas isolées 1 000 m² / 25 m (25 %) ; villégiature 10 000 m² / 60 m, 12 unités/ha.", terrasse=False),
    zone("PU", "PU", "Projet urbain",
         "Zone ouverte à l'urbanisation pour des projets urbains approuvés par une commission locale (loi 12-90).",
         ["projet urbain approuvé"], ["construction hors projet approuvé"], article="art. 51"),
    zone("RC", "ZR", "Zone du littoral",
         "Frange urbaine le long de la côte, de la mosquée Hassan II à la limite d'Anfa, soumise à une étude d'aménagement sectorielle.",
         [], ["construction hors étude sectorielle approuvée"], article="art. 52"),
]
