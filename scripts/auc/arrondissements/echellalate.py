# Plan d'aménagement de la commune d'Echellalate — fiches de zone (auc.ma).
import copy
from commun import *

NOM = "Commune Echellalate"
DOCUMENT = "PA de la commune d'Echellalate (AUC)"
PDF = "https://www.auc.ma"

B_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
I_INT = [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE]
I_INT_5 = [INDUSTRIE, "logements (hors gardiennage)", CARRIERES, PROVISOIRE]
PB_NOTE = "Un tiers de la parcelle reste non constructible (espace vert public) ; emprise calculée sur les deux tiers restants."
SA = ("Servitude aéronautique de l'aéroport de Tit Mellil : hauteur plafond fixée au plan (de 0 à 28 m selon "
      "l'emplacement), qui peut être inférieure à la hauteur du secteur. À vérifier sur le plan avant tout projet.")

BASE = [
    zone("A5", "A", "Immeubles haute densité", DEF_A, AUT_A, B_INT, h=20.5, etages=5, surface=400, facade=18,
         remarque="Hôtels et bureaux : 26,50 m (R+7). Ni COS ni emprise fixés.", article="zone A, art. 9-12"),
    zone("B3", "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=14.5, etages=3, surface=250, facade=12,
         remarque="Ni COS ni emprise fixés.", article="zone B, art. 16-19"),
    zone("B4", "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=17.5, etages=4, surface=250, facade=12,
         remarque="Ni COS ni emprise fixés.", article="zone B, art. 16-19"),
    zone("C3", "C", "Immeubles sur espaces verts", DEF_C, AUT_C,
         ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", "caves (hors parkings)", PROVISOIRE, DEPOTS, CARRIERES],
         h=14.5, etages=3, surface=5000, facade=40, cos=1.2, cus=0.35, article="zone C, art. 23-26"),
    zone("D1", "D", "Villas", DEF_D, AUT_D,
         [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES],
         h=8, etages=1, surface=200, facade=10, cus=0.5,
         remarque="Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %).", article="zone D, art. 30-33"),
    zone("D2", "D", "Villas", DEF_D, AUT_D,
         [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES],
         h=8, etages=1, surface=400, facade=20, cus=0.35, remarque="Villas isolées 400 m² / 20 m (emprise 35 %).",
         article="zone D, art. 30-33"),
    zone("E3", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=14.5, etages=3, surface=160, facade=10, cus=0.85,
         remarque="RDC commercial : emprise jusqu'à 100 %. " + sans_lotissement(1.5, 0.40), article="zone E, art. 37-40"),
    zone("E3s", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=14.5, etages=3, surface=84, facade=7,
         remarque="Opérations de recasement. RDC commercial : emprise jusqu'à 100 %.", article="zone E, art. 37-40"),
    zone("E4", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=17.5, etages=4, surface=5000, facade=50, cus=0.35, cos=1.5,
         article="zone E, art. 37-40"),
    zone("I2", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.",
         ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"], I_INT,
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, article="zone I, art. 51-54"),
    zone("I5", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"], I_INT_5,
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, article="zone I, art. 51-54"),
    zone("I5h1", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"], I_INT_5,
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, remarque="Hôtels : 24 m (R+5).", article="zone I, art. 51-54"),
    zone("I6s2", "I", "Activités aéroportuaires", "Activités aéroportuaires spécialisées et stockage associé.",
         ["activités aéroportuaires", "stockage lié"], ["logements (hors direction et surveillance)", "stockage polluant"],
         remarque="Constructions dans un rayon de 1 km soumises à l'autorité aéroportuaire.", article="zone I, art. 51-54"),
    zone("PBC3", "PB", "Bande verte — immeubles", "Transition entre bâti et espace naturel ; immeubles orientés.", AUT_C,
         ["établissements industriels et dépôts (toute nature)", PROVISOIRE, DEPOTS, CARRIERES],
         h=14.5, etages=3, surface=10000, facade=60, cos=1.2, cus=0.35, remarque=PB_NOTE, article="zone PB, art. 44-47"),
    zone("PBD1", "PB", "Bande verte — villas", "Transition entre bâti et espace naturel ; villas en bande ou jumelées.", AUT_D,
         ["établissements industriels et dépôts (toute nature)", PROVISOIRE, DEPOTS, CARRIERES],
         h=8, etages=1, surface=10000, facade=60, cus=0.5, remarque=PB_NOTE, article="zone PB, art. 44-47"),
    zone("PBD2", "PB", "Bande verte — villas", "Transition entre bâti et espace naturel ; villas isolées.", AUT_D,
         ["établissements industriels et dépôts (toute nature)", PROVISOIRE, DEPOTS, CARRIERES],
         h=8, etages=1, surface=10000, facade=60, cus=0.35, remarque=PB_NOTE, article="zone PB, art. 44-47"),
    zone("ZNAP", "ZR", "Gisements de calcaire (non aedificandi)",
         "Servitude non aedificandi : gisements de calcaire cimentier à préserver.",
         [], ["toute construction", "morcellement à fins immobilières"], remarque=NON_CONSTR, article="zone ZNAP, art. 79"),
    *zones_naturelles(zone, codes=("FR", "RA", "TVR", "PJP")),
]


def variante_sa(code_base, code_sa):
    """Secteur « …SA » : mêmes règles que le secteur de base, sous servitude aéronautique."""
    c, z = copy.deepcopy(next(x for x in BASE if x[0] == code_base))
    z["code"] = code_sa
    rem = z["parametres"].get("remarque")
    z["parametres"]["remarque"] = f"{SA} {rem}" if rem else SA
    return code_sa, z


ZONES = BASE + [
    variante_sa(b, s) for b, s in [
        ("A5", "A5SA"), ("B4", "B4SA"), ("D2", "D2SA"), ("E3", "E3SA"), ("I5", "I5sa"),
        ("I5h1", "I5h1SA"), ("PBC3", "PBC3SA"), ("RA", "RASA"), ("RA", "RAS1"), ("RA", "RAS1SA"), ("TVR", "TVRSA"),
    ]
]
