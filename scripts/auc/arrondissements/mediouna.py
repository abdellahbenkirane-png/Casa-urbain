# Plan d'aménagement de la commune de Médiouna — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Mediouna"
DOCUMENT = "PA de la commune de Médiouna (AUC)"
PDF = "https://www.auc.ma"

CAVES_P = "caves (hors parkings)"
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", CAVES_P, PROVISOIRE, CARRIERES]
I_INT = [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE]


def e(code, h, etages, surface, facade, cus=None, cos=None, sl=None):
    rem = " ".join(x for x in ["RDC commercial : emprise jusqu'à 100 %." if code != "E4" else None,
                               sans_lotissement(*sl) if sl else None,
                               "Lotissements : 5 % du terrain en espaces libres plantés."] if x)
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages, surface=surface,
                facade=facade, cus=cus, cos=cos, remarque=rem, article="zone E, art. 30-33")


ZONES = [
    zone("B3", "B", "Immeubles collectifs", DEF_B, MIXTE, [INDUSTRIE, "entrepôts et dépôts > 300 m²", CAVES_P, PROVISOIRE, CARRIERES],
         h=14.5, etages=3, surface=250, facade=12, remarque="Ni COS ni emprise fixés. Implantation à l'alignement.",
         article="zone B, art. 9-13"),
    zone("C3", "C", "Immeubles sur espaces verts", DEF_C, AUT_C,
         ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", CAVES_P, PROVISOIRE, DEPOTS, CARRIERES],
         h=14.5, etages=3, surface=5000, facade=40, cos=1.2, cus=0.35, article="zone C, art. 16-19"),
    zone("D1", "D", "Villas", DEF_D, AUT_D,
         [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES],
         h=8, etages=1, surface=200, facade=10, cus=0.5,
         remarque="Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %).", article="zone D, art. 23-26"),
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.40)),
    e("E2s", 11.5, 2, 60, 6),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    e("E3s", 14.5, 3, 84, 7, sl=(1.5, 0.40)),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    zone("I2s1", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.",
         ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"], I_INT,
         h=20.5, etages=4, surface=500, facade=20, remarque="Emprise au sol non fixée.", article="zone I, art. 37-40"),
    zone("I5h1", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"], I_INT,
         h=17.5, etages=3, surface=1000, facade=30, remarque="Hôtels : 24 m (R+5).", article="zone I, art. 37-40"),
]
