# Plan d'aménagement de la municipalité de Bouskoura (et PA sectoriel) — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Bouskoura"
DOCUMENT = "PA de la municipalité de Bouskoura (AUC)"
PDF = "https://www.auc.ma"

B_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
C_INT = ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", PROVISOIRE, DEPOTS, CARRIERES]
D_INT = [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
IND = ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"]
I_INT = [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE]
I_INT_5 = [INDUSTRIE, "logements (hors gardiennage)", CARRIERES, PROVISOIRE]
D_NOTE = "Cliniques et hôpitaux : 14,50 m (R+3). Commerces de proximité : emprise 50 %."


def c(code, cos, cus, surface, facade, h, etages):
    return zone(code, "C", "Immeubles sur espaces verts", DEF_C, AUT_C, C_INT, h=h, etages=etages,
                surface=surface, facade=facade, cos=cos, cus=cus, article="zone C, art. 23-26")


def d(code, surface, facade, cus, detail, terrasse=False, h=8, etages=1):
    return zone(code, "D", "Villas", DEF_D, AUT_D, D_INT + ([] if terrasse else ["accès aux terrasses"]),
                h=h, etages=etages, surface=surface, facade=facade, cus=cus,
                remarque=f"{detail} {D_NOTE}", article="zone D, art. 30-33")


def e(code, h, etages, surface, facade, cus=None, cos=None, sl=None):
    note = " ".join(x for x in [
        "RDC commercial : emprise jusqu'à 100 %." if code in ("E2", "E3", "E3s") else None,
        sans_lotissement(*sl) if sl else None,
        "Lotissements : 5 % du terrain en espaces libres plantés."] if x)
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, cos=cos, remarque=note, article="zone E, art. 37-40")


ZONES = [
    zone("A5s7", "A", "Immeubles haute densité", DEF_A, AUT_A, B_INT, h=20.5, etages=5, surface=400, facade=18,
         remarque="Opérations ≥ 10 000 m² : R+6 (23,50 m) sur 35 % et R+7 (26,50 m) sur 45 % de l'emprise. Ni COS ni emprise fixés.",
         article="zone A, art. 9-12"),
    zone("B3", "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=14.5, etages=3, surface=250, facade=12,
         remarque="Ni COS ni emprise fixés. Implantation à l'alignement.", article="zone B, art. 16-19"),
    c("C2", 1.0, 0.40, 5000, 40, 11.5, 2),
    c("C3", 1.2, 0.35, 5000, 40, 14.5, 3),
    c("C4", 1.3, 0.30, 10000, 60, 17.5, 4),
    d("D1", 200, 10, 0.5, "Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %).", terrasse=True),
    d("D2", 400, 20, 0.35, "Villas isolées 400 m² / 20 m (emprise 35 %)."),
    d("D2s", 400, 20, 0.35, "Villas isolées 400 m² / 20 m (35 %) ; villégiature 10 000 m² / 60 m, 22 unités/ha."),
    d("D3s", 600, 22, 0.35, "Villas isolées 600 m² / 22 m (35 %) ; villégiature 10 000 m² / 60 m, 18 unités/ha."),
    d("D4s", 1000, 25, 0.25, "Villas isolées 1 000 m² / 25 m (25 %) ; villégiature 10 000 m² / 60 m, 12 unités/ha."),
    d("D5s2", 10000, 60, 0.10,
      "Régi par le cahier des charges de l'opération : villas en villégiature (10 %) ou immeubles orientés R+2, 11,50 m (20 %), sur 10 000 m² / 60 m."),
    d("D7", 10000, 50, 0.10, "Villas isolées sur 10 000 m² / 50 m (emprise 10 %)."),
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.45)),
    e("E2s", 11.5, 2, 60, 6),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    e("E3s", 14.5, 3, 84, 7),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    zone("I2", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.", IND, I_INT,
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, article="zone I, art. 45-48"),
    zone("I2s1", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.", IND, I_INT,
         h=20.5, etages=4, surface=500, facade=20, remarque="Emprise au sol non fixée.", article="zone I, art. 45-48"),
    zone("I5", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"], I_INT_5,
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, article="zone I, art. 45-48"),
    zone("I8", "I", "Parc logistique", "Transbordement et stockage de marchandises.",
         ["logistique", "entrepôts"], I_INT_5, h=17.5, etages=3, surface=5000, facade=60, cus=0.5,
         article="zone I, art. 45-48"),
    zone("TL", "I", "Tertiaire et loisirs (route de l'aéroport)",
         "Activités tertiaires, bureaux, show-rooms et restaurants le long de l'axe de l'aéroport Mohammed V ; hôtels associés aux loisirs.",
         ["bureaux", "tertiaire", "show-rooms", "restauration", "hôtellerie (grandes parcelles)"],
         ["habitat", "lotissements", "dépôts et hangars", "industrie", CARRIERES],
         h=10, etages=2, surface=5000, facade=30, cos=0.4, cus=0.2,
         remarque="Hôtels : COS 0,8, 21 m (R+5), 2 ha / 50 m minimum. Recul de 10 m sur voie. Hauteur sous plafond 3,50 m minimum.",
         article="PA sectoriel, zone TL, art. 24-28"),
    zone("GPSL", "PB", "Sport et loisirs de plein air",
         "Espace ouvert protégé pour le sport et les loisirs (golfs, hippodromes, plaines de jeux).",
         ["sport et loisirs", "équipements touristiques"],
         ["morcellement", "habitation", "dépôts et hangars", "industrie", CARRIERES], remarque=NON_CONSTR, article="zone GPSL"),
    *zones_naturelles(zone, codes=("FR", "RA", "RS", "TVR", "PJP", "ZR")),
]
