# Plan d'aménagement de l'arrondissement de Sidi Moumen — fiches de zone (auc.ma).
from commun import *

NOM = "Sidi Moumen"
DOCUMENT = "PA de l'arrondissement de Sidi Moumen (AUC)"
PDF = "https://www.auc.ma"

B_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
C_INT = ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", PROVISOIRE, DEPOTS, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
FB = "Fronts bâtis FB3 (14,50 m), FB4 (17,50 m) et FB5 (20,50 m) le long de certains axes."
IND = ["industrie 2e et 3e catégorie", "artisanat", "entrepôts", "show-rooms (linéaire FBS)"]
I_INT = [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE]


def a(code, h_hotel, etages_hotel, extra=""):
    return zone(code, "A", "Immeubles haute densité", DEF_A, AUT_A, B_INT, h=20.5, etages=5, surface=400, facade=18,
                remarque=f"Hôtels et bureaux : jusqu'à {str(h_hotel).replace('.', ',')} m (R+{etages_hotel}). Ni COS ni emprise fixés. {extra}".strip(),
                article="zone A, art. 9-12")


def b(code, h, etages, surface):
    return zone(code, "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=h, etages=etages, surface=surface, facade=12,
                remarque=f"Ni COS ni emprise fixés. {FB}", article="zone B, art. 16-19")


def e(code, h, etages, surface, facade, cus=None, cos=None, sl=None):
    note = " ".join(x for x in [
        "RDC commercial : emprise jusqu'à 100 %." if code in ("E2", "E3", "E3s") else None,
        sans_lotissement(*sl) if sl else None, FB,
        "Lotissements : 5 % du terrain en espaces libres plantés."] if x)
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, cos=cos, remarque=note, article="zone E, art. 37-40")


ZONES = [
    a("A5", 26.5, 7),
    a("A5s", 30, 8, "Expertise géotechnique requise (anciennes carrières)."),
    b("B3", 14.5, 3, 250),
    b("B3s", 14.5, 3, 300),
    b("B4", 17.5, 4, 250),
    zone("C3", "C", "Immeubles sur espaces verts", DEF_C, AUT_C, C_INT, h=14.5, etages=3,
         surface=5000, facade=40, cos=1.2, cus=0.35, article="zone C"),
    zone("C4", "C", "Immeubles sur espaces verts", DEF_C, AUT_C, C_INT, h=17.5, etages=4,
         surface=10000, facade=60, cos=1.3, cus=0.30, article="zone C"),
    zone("D1", "D", "Villas", DEF_D, AUT_D,
         [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES],
         h=8, etages=1, surface=200, facade=10, cus=0.5,
         remarque="Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %). Recul de 4 m sur voie.",
         article="zone D, art. 30-33"),
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.45)),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    e("E3s", 14.5, 3, 84, 7),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    zone("I2", "I", "Activités industrielles", "Activités industrielles, artisanales et tertiaires.", IND, I_INT,
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, article="zone I, art. 45-48"),
    zone("I2s1", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.", IND, I_INT,
         h=20.5, etages=4, surface=500, facade=20, remarque="Emprise au sol non fixée.", article="zone I, art. 45-48"),
    # Modification du PA (secteurs « SECT ») : B3s4, I3, I8.
    zone("B3s4", "B", "Immeubles collectifs", DEF_B, MIXTE,
         B_INT + ["commerces en RDC (hors linéaire de commerce et de service)"], h=14.5, etages=3, surface=250, facade=12,
         remarque="R+3 sur les voies de 12 à 15 m, R+4 (17,50 m) sur les voies ≥ 20 m. Ni COS ni emprise fixés. Mixité sociale : 70 % au plus de la typologie dominante.",
         article="modification du PA, zone B, art. 28-31"),
    zone("I3", "I", "Petite industrie & tertiaire",
         "Industrie de 3e catégorie, artisanat, tertiaire et équipements publics ou privés.",
         ["industrie 3e catégorie", "artisanat", "tertiaire", "équipements"],
         ["établissements industriels de 1re et 2e catégorie", "logements (sauf un par lot)", CARRIERES, PROVISOIRE],
         h=14.5, etages=3, surface=360, facade=12, cus=0.6, article="modification du PA, zone I, art. 42-45"),
    zone("I8", "I", "Parc logistique", "Bâtiments et installations de transbordement et de stockage de marchandises.",
         ["logistique", "entrepôts"], [INDUSTRIE, LOGEMENTS, CARRIERES, PROVISOIRE],
         h=17.5, etages=3, surface=5000, facade=60, cus=0.5, article="modification du PA, zone I, art. 42-45"),
    zone("CV", "PB", "Ceinture verte", DEF_CV,
         ["espaces verts", "sports et loisirs", "cimetières", "bassins de retenue", "agriculture"],
         ["habitat", "lotissements", "dépôts et hangars", "industrie", CARRIERES],
         remarque="Zone non constructible pour l'habitat.", article="zone CV, art. 53-57"),
    zone("PJP", "PB", "Parcs et jardins publics",
         "Terrains réservés à de futurs parcs et jardins publics : inconstructibles.",
         ["activité agricole en attendant l'acquisition"], ["toute construction non agricole"],
         remarque="Emplacement réservé pour une acquisition future par la collectivité.", article="zone PJP"),
    zone("SP", "PB", "Parc urbain (carrière de Sidi Moumen)",
         "Emprise de l'ancienne carrière, destinée à un grand parc urbain avec équipements sportifs et récréatifs.",
         ["parc urbain", "équipements sportifs et récréatifs"], ["habitat", "construction hors projet intégré"],
         article="art. 60"),
]
