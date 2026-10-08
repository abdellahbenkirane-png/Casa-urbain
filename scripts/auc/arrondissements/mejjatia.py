# Plan d'aménagement de la commune de Mejjatia Ouled Taleb — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Mejjatia Ouled Taleb"
DOCUMENT = "PA de la commune de Mejjatia Ouled Taleb (AUC)"
PDF = "https://www.auc.ma"

CAVES_P = "caves (hors parkings)"
B_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", CAVES_P, PROVISOIRE, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", CAVES_P, PROVISOIRE, CARRIERES]
D_INT = [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES]
I_NOTE = "Recul de 5 m sur voie et en limites. Hauteur sous plafond 3,50 m minimum."
FB = "Fronts bâtis FB4 (17,50 m) et FB5 (20 m) le long de certains axes."

ZONES = [
    zone("A5", "A", "Immeubles haute densité", DEF_A, AUT_A, B_INT, h=20.5, etages=5, surface=400, facade=18,
         remarque="Hôtels et bureaux : 26,50 m (R+7). Ni COS ni emprise fixés.", article="zone A, art. 9-13"),
    zone("B3", "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=14.5, etages=3, surface=250, facade=12,
         remarque=f"Ni COS ni emprise fixés. {FB}", article="zone B, art. 16-19"),
    zone("B4", "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=17.5, etages=4, surface=250, facade=12,
         remarque=f"Ni COS ni emprise fixés. {FB}", article="zone B, art. 16-19"),
    zone("C3", "C", "Immeubles sur espaces verts", DEF_C, AUT_C,
         ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", CAVES_P, PROVISOIRE, DEPOTS, CARRIERES],
         h=14.5, etages=3, surface=5000, facade=40, cos=1.2, cus=0.35, article="zone C, art. 23-26"),
    zone("D1", "D", "Villas", DEF_D, AUT_D, D_INT, h=8, etages=1, surface=200, facade=10, cus=0.5,
         remarque="Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %).", article="zone D, art. 30-33"),
    zone("D2s", "D", "Villas", DEF_D, AUT_D, D_INT, h=8, etages=1, surface=400, facade=20, cus=0.35,
         remarque="Villas isolées 400 m² / 20 m (35 %) ; villégiature 10 000 m² / 60 m (35 %).", article="zone D, art. 30-33"),
    zone("E3", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=14.5, etages=3, surface=160, facade=10, cus=0.85,
         remarque="RDC commercial : emprise jusqu'à 100 %. Groupes d'habitations : COS 1,5 et emprise 40 %.", article="zone E, art. 37-40"),
    zone("E3s", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=14.5, etages=3, surface=84, facade=7,
         remarque="RDC commercial : emprise jusqu'à 100 %.", article="zone E, art. 37-40"),
    zone("E4", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=17.5, etages=4, surface=5000, facade=50, cos=1.5, cus=0.35,
         article="zone E, art. 37-40"),
    zone("I2", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.",
         ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"],
         [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE],
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, remarque=I_NOTE, article="zone I, art. 44-49"),
    zone("I5h1", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"],
         [INDUSTRIE, "logements (hors gardiennage)", CARRIERES, PROVISOIRE],
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, remarque="Hôtels : 24 m (R+5). " + I_NOTE, article="zone I, art. 44-49"),
    zone("I5s4", "I", "Activités & bureaux", "Tertiaire, commerce, enseignement, artisanat et industrie non polluante.",
         ["tertiaire", "commerce", "bureaux", "artisanat", "industrie non polluante"],
         [INDUSTRIE_1, "logements (hors gardiennage)", CARRIERES, PROVISOIRE],
         h=20.5, etages=4, surface=500, facade=20, cus=0.4, remarque=I_NOTE, article="zone I, art. 44-49"),
    zone("GE", "PU", "Grands équipements",
         "Grands équipements d'intérêt général (cité des sports, université, stade) selon un programme spécifique.",
         ["grands équipements"], ["construction hors programme approuvé"], article="zone GE, art. 51"),
    *zones_naturelles(zone, codes=("FR", "RA", "RAs", "TVR", "PJP", "ZR", "ZNAP")),
]
