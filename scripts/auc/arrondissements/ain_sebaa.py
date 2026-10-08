# Plan d'aménagement de l'arrondissement d'Aïn Sebaâ — fiches de zone (auc.ma).
from commun import *

NOM = "Ain Sebaa"
DOCUMENT = "PA de l'arrondissement d'Aïn Sebaâ (AUC)"
PDF = "https://www.auc.ma"

A_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
C_INT = ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", PROVISOIRE, DEPOTS, CARRIERES]
D_INT = [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
E_NOTE = "RDC commercial : emprise jusqu'à 100 % en E2 et E3. {sl}"


def a(code, h, etages, h_hotel, etages_hotel):
    return zone(code, "A", "Immeubles haute densité", DEF_A, AUT_A, A_INT,
                h=h, etages=etages, surface=400, facade=18,
                remarque=f"Hôtels et bureaux : jusqu'à {str(h_hotel).replace('.', ',')} m (R+{etages_hotel}). Ni COS ni emprise fixés.",
                article="zone A, art. 9-15")


def e(code, h, etages, surface, facade, cus=None, cos=None, sl=None):
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT,
                h=h, etages=etages, surface=surface, facade=facade, cus=cus, cos=cos,
                remarque=E_NOTE.format(sl=sans_lotissement(*sl) if sl else "").strip(),
                article="zone E, art. 37-40")


ZONES = [
    a("A5", 20.5, 5, 26.5, 7),
    a("A6", 23.5, 6, 30, 8),
    zone("B4", "B", "Immeubles collectifs", DEF_B, MIXTE, A_INT,
         h=17.5, etages=4, surface=250, facade=12,
         remarque="Ni COS ni emprise fixés. Front bâti FB5 (20,50 m, R+5) le long de certains axes.",
         article="zone B, art. 16-21"),
    zone("C3", "C", "Immeubles sur cour", DEF_C, AUT_C, C_INT,
         h=14.5, etages=3, surface=5000, facade=40, cos=1.2, cus=0.35, article="zone C, art. 23-26"),
    zone("C4", "C", "Immeubles sur cour", DEF_C, AUT_C, C_INT,
         h=17.5, etages=4, surface=10000, facade=60, cos=1.3, cus=0.30, article="zone C, art. 23-26"),
    zone("D1", "D", "Villas", DEF_D, AUT_D, D_INT,
         h=8, etages=1, surface=200, facade=10, cus=0.5,
         remarque="Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %). Cliniques : 11,50 m (R+2). Recul de 4 m sur voie.",
         article="zone D, art. 30-35"),
    e("E2s", 11.5, 2, 60, 6),
    e("E2", 11.5, 2, 100, 8, cus=0.84, sl=(1.2, 0.45)),
    e("E3", 14.5, 3, 160, 10, cus=0.85, sl=(1.5, 0.40)),
    e("E4", 17.5, 4, 5000, 50, cus=0.35, cos=1.5),
    zone("I2s1", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.",
         ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"],
         [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE],
         h=20.5, etages=4, surface=500, facade=20, article="zone I, art. 44-47"),
    zone("I5", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"],
         [INDUSTRIE, LOGEMENTS, CARRIERES, PROVISOIRE],
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, article="zone I, art. 44-47"),
    zone("I8", "I", "Logistique", "Activités logistiques (stockage, distribution) et équipements de la zone.",
         ["logistique", "entrepôts", "équipements"],
         [INDUSTRIE, LOGEMENTS, CARRIERES, PROVISOIRE],
         h=17.5, etages=3, surface=5000, facade=60, cus=0.5, article="zone I, art. 44-47"),
    zone("CV", "PB", "Ceinture verte", DEF_CV,
         ["espaces verts", "sports et loisirs", "équipements de la zone"],
         ["habitat", "lotissements", "dépôts et hangars", "industrie", CARRIERES],
         remarque="Zone non constructible pour l'habitat.", article="zone CV, art. 52-56"),
    zone("RC", "ZR", "Protection du domaine maritime", DEF_RC, [], ["toute construction"],
         remarque="Servitude non aedificandi : aucune construction ni installation.", article="zone RC, art. 59"),
]
