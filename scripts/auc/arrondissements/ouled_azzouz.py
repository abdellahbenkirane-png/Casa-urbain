# Plan d'aménagement de la commune rurale d'Ouled Azzouz — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Ouled Azzouz"
DOCUMENT = "PA de la commune rurale d'Ouled Azzouz (AUC)"
PDF = "https://www.auc.ma"

D_INT = [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
I_INT = [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE]
I_INT_5 = [INDUSTRIE, "logements (hors gardiennage)", CARRIERES, PROVISOIRE]

ZONES = [
    zone("B3", "B", "Immeubles collectifs", DEF_B, MIXTE, [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES],
         h=14.5, etages=3, surface=250, facade=12, remarque="Ni COS ni emprise fixés. Implantation à l'alignement.",
         article="zone B, art. 9-13"),
    zone("C2", "C", "Immeubles sur espaces verts", DEF_C, AUT_C,
         ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", PROVISOIRE, DEPOTS, CARRIERES],
         h=11.5, etages=2, surface=5000, facade=40, cos=1.0, cus=0.40, article="zone C, art. 23-26"),
    zone("D1", "D", "Villas", DEF_D, AUT_D, D_INT, h=8, etages=1, surface=200, facade=10, cus=0.5,
         remarque="Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %).", article="zone D, art. 30-33"),
    zone("D2s", "D", "Villas", DEF_D, AUT_D, D_INT + ["accès aux terrasses"], h=8, etages=1, surface=400, facade=20, cus=0.35,
         remarque="Villas isolées 400 m² / 20 m (35 %) ; villégiature 10 000 m² / 60 m (35 %).", article="zone D, art. 30-33"),
    zone("D3s", "D", "Villas", DEF_D, AUT_D, D_INT + ["accès aux terrasses"], h=8, etages=1, surface=600, facade=22, cus=0.35,
         remarque="Villas isolées 600 m² / 22 m (35 %) ; villégiature 10 000 m² / 60 m (35 %).", article="zone D, art. 30-33"),
    zone("E2s", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=11.5, etages=2, surface=60, facade=6,
         remarque="RDC commercial : emprise jusqu'à 100 %.", article="zone E, art. 37-40"),
    *zones_e_standard(zone, "zone E, art. 37-40", codes=("E3", "E4")),
    zone("I2s1", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.",
         ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"], I_INT,
         h=20.5, etages=4, surface=500, facade=20, remarque="Emprise au sol non fixée.", article="zone I, art. 44-47"),
    zone("I5", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"], I_INT_5,
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, article="zone I, art. 44-47"),
    zone("I8", "I", "Parc logistique", "Transbordement et stockage de marchandises.", ["logistique", "entrepôts"], I_INT_5,
         h=17.5, etages=3, surface=5000, facade=60, cus=0.5, article="zone I, art. 44-47"),
    gpsl(zone),
    *zones_naturelles(zone, codes=("CV", "RA", "TVR")),
]
