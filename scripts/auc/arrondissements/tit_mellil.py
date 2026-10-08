# Plan d'aménagement de la municipalité de Tit Mellil — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Tit Mellil"
DOCUMENT = "PA de la municipalité de Tit Mellil (AUC)"
PDF = "https://www.auc.ma"

B_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
IND = ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"]
I_INT = [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE]
I_NOTE = "Recul de 5 m sur voie et en limites. Hauteur sous plafond 3,50 m minimum."
FB3 = "Front bâti FB3 (14,50 m) le long de certains axes."

ZONES = [
    zone("B3s", "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=14.5, etages=3, surface=300, facade=12,
         remarque=f"Ni COS ni emprise fixés. {FB3}", article="zone B, art. 9-13"),
    zone("B5", "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=20.5, etages=5, surface=300, facade=12,
         remarque="Ni COS ni emprise fixés. Implantation à l'alignement.", article="zone B, art. 9-13"),
    zone("C3", "C", "Immeubles sur espaces verts", DEF_C, AUT_C,
         ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", PROVISOIRE, DEPOTS, CARRIERES],
         h=14.5, etages=3, surface=5000, facade=40, cos=1.2, cus=0.35, remarque=FB3, article="zone C, art. 16-19"),
    zone("D1", "D", "Villas", DEF_D, AUT_D,
         [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES],
         h=8, etages=1, surface=200, facade=10, cus=0.5,
         remarque="Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %).", article="zone D, art. 23-26"),
    zone("D2s", "D", "Villas", DEF_D, AUT_D,
         [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES, "accès aux terrasses"],
         h=8, etages=1, surface=400, facade=20, cus=0.35,
         remarque="Villas isolées 400 m² / 20 m (35 %) ; villégiature 10 000 m² / 60 m, 22 unités/ha.", article="zone D, art. 23-26"),
    *zones_e_standard(zone, "zone E, art. 30-33", codes=("E2", "E4"), note=FB3),
    zone("E2sr", "E", "Tissu existant mixte", DEF_E, AUT_E,
         [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES],
         h=11.5, etages=2, surface=60, facade=6, remarque=FB3, article="zone E, art. 30-33"),
    zone("I2", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.", IND, I_INT,
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, remarque=I_NOTE, article="zone I, art. 37-42"),
    zone("I2s2", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.", IND, I_INT,
         h=20.5, etages=4, surface=500, facade=20,
         remarque="Repris des règles du secteur I2s1 du même PA (I2s2 n'a pas de fiche propre). " + I_NOTE,
         article="zone I, art. 37-42"),
    zone("I4", "I", "Artisanat & tertiaire", "Activités artisanales, tertiaires et commerciales ; hôtellerie et équipements.",
         ["artisanat", "tertiaire", "commerce", "hôtellerie", "équipements"], ["logements en rez-de-chaussée", CARRIERES, PROVISOIRE],
         h=11.5, etages=2, surface=160, facade=10,
         remarque="Implantation à l'alignement, en limites séparatives possible. Emprise non fixée.", article="zone I, art. 37-42"),
    zone("I5", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"],
         [INDUSTRIE, "logements (hors gardiennage)", CARRIERES, PROVISOIRE],
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, remarque=I_NOTE, article="zone I, art. 37-42"),
    *zones_naturelles(zone, codes=("RA", "RS")),
]
