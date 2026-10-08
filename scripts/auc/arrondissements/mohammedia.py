# Plan d'aménagement de la commune urbaine de Mohammedia — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Mohammedia"
DOCUMENT = "PA de la commune de Mohammedia (AUC)"
PDF = "https://www.auc.ma"

B_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
C_INT = ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", PROVISOIRE, DEPOTS, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
FB = "Fronts bâtis FB3 (14,50 m) et FB4 (17,50 m) le long de certains axes."
IND = ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"]
I_INT = [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE]
I_NOTE = "Recul de 5 m sur voie et H/2 (5 m min.) en limites. Hauteur sous plafond 3,50 m minimum."


def b(code, h, etages, surface, extra=""):
    return zone(code, "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=h, etages=etages, surface=surface, facade=12,
                remarque=f"Ni COS ni emprise fixés. Front bâti FB4 (17,50 m) le long de certains axes. {extra}".strip(),
                article="zone B, art. 16-20")


def c(code, cos, cus, surface, facade, h, etages):
    return zone(code, "C", "Immeubles sur espaces verts", DEF_C, AUT_C, C_INT, h=h, etages=etages,
                surface=surface, facade=facade, cos=cos, cus=cus,
                remarque="Recul de 4 m sur voie, égal à la hauteur (8 m min.) en limites séparatives.",
                article="zone C, art. 23-28")


def e(code, h, etages, surface, facade, cus=None, cos=None, sl=None, extra=None):
    note = " ".join(x for x in [
        "RDC commercial : emprise jusqu'à 100 %." if code in ("E2", "E3", "E3s1") else None,
        sans_lotissement(*sl) if sl else None, extra, FB] if x)
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, cos=cos, remarque=note, article="zone E, art. 37-41")


ZONES = [
    b("B3", 14.5, 3, 250),
    b("B3s2", 14.5, 3, 250, "Programme résidentiel et touristique. Opérations > 2 000 m² : R+4 sur 20 % et R+5 sur 60 % de l'emprise. Recul de 4 m."),
    b("B4s", 17.5, 4, 300, "Recul de 4 m sur voie, traité en jardin."),
    b("B5", 21.5, 5, 300),
    c("C3", 1.2, 0.35, 5000, 40, 14.5, 3),
    c("C4", 1.3, 0.30, 10000, 60, 17.5, 4),
    c("C5", 1.5, 0.25, 10000, 60, 20.5, 5),
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.45)),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    e("E3s1", 14.5, 3, 160, 10, 0.85, extra="Secteur mixte : immeubles de type E2 ou E3."),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    zone("I2", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.", IND, I_INT,
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, remarque=I_NOTE, article="zone I, art. 51-56"),
    zone("I5", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"],
         [INDUSTRIE, "logements (hors gardiennage)", CARRIERES, PROVISOIRE],
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, remarque=I_NOTE, article="zone I, art. 51-56"),
    zone("I8", "I", "Parc logistique", "Activités logistiques (stockage, distribution) et équipements de la zone.",
         ["logistique", "entrepôts"], I_INT, h=17.5, etages=3, surface=5000, facade=60, cus=0.5,
         remarque=I_NOTE, article="zone I, art. 51-56"),
    *zones_naturelles(zone, codes=("CV", "RC")),
]
