# Plan d'aménagement de l'arrondissement de Hay Mohammadi — fiches de zone (auc.ma).
from commun import *

NOM = "Hay Mohammadi"
DOCUMENT = "PA de l'arrondissement de Hay Mohammadi (AUC)"
PDF = "https://www.auc.ma"

B_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
C_INT = ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", PROVISOIRE, DEPOTS, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
E_NOTE = ("RDC commercial : emprise jusqu'à 100 % en E2s2 et E3s2. Fronts bâtis FB3 (14,50 m), "
          "FB4 (17,50 m) et FB7 (26,50 m) le long de certains axes.")


def c(code, cos, surface, facade, h, etages):
    return zone(code, "C", "Immeubles sur espaces verts", DEF_C, AUT_C, C_INT, h=h, etages=etages,
                surface=surface, facade=facade, cos=cos, cus=0.25,
                remarque="Cité Candilis : site d'intérêt architectural à préserver.",
                article="zone C, art. 16-19")


def e(code, h, etages, surface, facade, cus, cos=None):
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, cos=cos,
                remarque=E_NOTE + " Lotissements : 5 % du terrain en espaces libres plantés.",
                article="zone E, art. 30-33")


ZONES = [
    zone("B5", "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=20.5, etages=5, surface=300, facade=12,
         remarque="Ni COS ni emprise fixés. Implantation à l'alignement.", article="zone B, art. 9-13"),
    c("C2s", 0.6, 5000, 40, 11.5, 2),
    c("C3s", 0.8, 10000, 60, 14.5, 3),
    zone("D1s3", "D", "Villas", DEF_D, AUT_D,
         [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES],
         h=8, etages=1, surface=160, facade=8, cus=0.5,
         remarque="Villas en bande 160 m² / 8 m (emprise 50 %), jumelées 240 m² / 12 m (40 %). Recul de 4 m sur voie.",
         article="zone D, art. 23-27"),
    e("E2s2", 11.5, 2, 100, 8, 0.84),
    e("E3s2", 14.5, 3, 160, 10, 0.84),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    zone("I2s1", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.",
         ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"],
         [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE],
         h=20.5, etages=4, surface=500, facade=20, remarque="Ni COS ni emprise fixés.",
         article="zone I, art. 37-40"),
    zone("ZP", "PU", "Projet urbain",
         "Zone ouverte à l'urbanisation pour des projets urbains approuvés par une commission locale (loi 12-90).",
         ["projet urbain approuvé"], ["construction hors projet approuvé"], article="art. 44"),
]
