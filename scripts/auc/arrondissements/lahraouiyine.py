# Plan d'aménagement de la commune de Lahraouiyine (2025) — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Lahraouiyine"
DOCUMENT = "PA de la commune de Lahraouiyine (AUC, 2025)"
PDF = "https://www.auc.ma"

A_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES, "opérations de logement social", CAVES]
E_INT = [INDUSTRIE, DEPOTS, PROVISOIRE, MORCELLEMENT, CARRIERES, CAVES]
IND = ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"]
I_INT = [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE]
I_INT_5 = [INDUSTRIE, "logements (hors gardiennage)", CARRIERES, PROVISOIRE]
I_NOTE = "Recul de 5 m sur voie et H/2 (5 m min.) en limites. Hauteur sous plafond 3,50 m (5,50 m en RDC)."
SOCIAL = "Logements sociaux : 60 % des unités au plus."


def a(code, h, etages, surface, facade, h_hotel, etages_hotel, cus=None, extra=None):
    return zone(code, "A", "Immeubles haute densité", DEF_A, AUT_A, A_INT + ([extra] if extra else []),
                h=h, etages=etages, surface=surface, facade=facade, cus=cus,
                remarque=f"Hôtels et bureaux : {str(h_hotel).replace('.', ',')} m (R+{etages_hotel}). "
                         + ("Emprise de 25 % équipements compris ; " if cus else "Ni COS ni emprise fixés ; ")
                         + "mixité sociale 70 % au plus de la typologie dominante.",
                article="zone A, art. 21-26")


def i(code, nom, desc, aut, interdits, h, etages, surface, facade, cus=0.5, cos=None, extra=None):
    return zone(code, "I", nom, desc, aut, interdits, h=h, etages=etages, surface=surface, facade=facade,
                cus=cus, cos=cos, remarque=" ".join(x for x in [extra, I_NOTE] if x), article="zone I, art. 44-49")


ZONES = [
    a("A5", 20.5, 5, 400, 18, 26.5, 7),
    a("A6s2", 23.5, 6, 350, 18, 30, 8, cus=0.25, extra="lotissements"),
    a("A6s4", 23.5, 6, 500, 20, 30, 8, cus=0.25, extra="lotissements"),
    zone("E3", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=14.5, etages=3, surface=160, facade=10, cus=0.85,
         remarque=f"RDC commercial : emprise jusqu'à 100 %. {SOCIAL}", article="zone E, art. 28-31"),
    zone("E3s", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=14.5, etages=3, surface=84, facade=7,
         remarque=SOCIAL, article="zone E, art. 28-31"),
    zone("E4", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=17.5, etages=4, surface=5000, facade=50,
         cus=0.35, cos=1.5, remarque=SOCIAL, article="zone E, art. 28-31"),
    zone("ZPI", "PU", "Projet intégré",
         "Programme mixte (logement, commerce, bureaux, hôtellerie) en projet intégré ; un tiers du terrain cédé en bande verte.",
         ["habitat collectif", "commerce", "bureaux", "hôtellerie", "services"],
         [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES, "opérations de logement social"],
         surface=50000, cos=2.0, cus=0.3,
         remarque="Terrain de 5 ha minimum. Hauteurs libres dans la limite du COS 2 et de l'emprise 30 %. 15 % au moins de la surface constructible en commerces, tertiaire ou hôtellerie.",
         article="zone ZPI, art. 35-38"),
    i("I2", "Parc industriel intégré", "Parcs industriels intégrés (industrie de 2e et 3e catégorie).", IND, I_INT, 17.5, 3, 1000, 30),
    i("I2s1", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.", IND, I_INT, 20.5, 4, 500, 20, cus=None,
      extra="Emprise au sol non fixée."),
    i("I5", "Activités & bureaux", "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
      ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"], I_INT_5, 17.5, 3, 1000, 30),
    i("I5s4", "Activités & bureaux", "Bureaux, services, commerces et petites activités industrielles non nuisantes.",
      ["bureaux", "services", "commerce", "petite industrie non nuisante", "hôtellerie"], I_INT, 20.5, 4, 500, 20, cus=0.4, cos=2.0),
    i("I5s6", "Activités textiles", "Petites activités industrielles non nuisantes (textile), régies par le cahier des charges.",
      ["petite industrie non nuisante (textile)"], I_INT, None, None, None, None,
      extra="Surface et hauteur fixées par le cahier des charges de l'opération."),
    i("I5H", "Show-rooms & bureaux", "Show-rooms, expositions commerciales, enseignement et recherche ; hôtellerie et équipements.",
      ["show-rooms", "bureaux", "enseignement", "hôtellerie", "équipements"], I_INT_5, 17.5, 3, 1000, 30,
      extra="Bureaux : 28,50 m (R+6) ; hôtels : 36 m (R+8)."),
    i("I8s1", "Parc logistique", "Logistique (60 % au moins de la surface constructible) et industrie de 2e et 3e catégorie.",
      ["logistique", "entrepôts", "industrie 2e et 3e catégorie"], I_INT, 17.5, 3, 5000, 60),
    zone("GPSL", "PB", "Sport et loisirs de plein air",
         "Espace ouvert protégé pour le sport et les loisirs (golfs, hippodromes, plaines de jeux).",
         ["sport et loisirs", "équipements touristiques"],
         ["morcellement", "habitation", "dépôts et hangars", "industrie", CARRIERES], remarque=NON_CONSTR, article="zone GPSL"),
    *zones_naturelles(zone, codes=("TVR", "ZR")),
]
