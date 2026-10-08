# Plan d'aménagement de l'arrondissement de Sbata — fiches de zone (auc.ma).
from commun import *

NOM = "Sbata"
DOCUMENT = "PA de l'arrondissement de Sbata (AUC)"
PDF = "https://www.auc.ma"

A_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES, "opérations de logement social"]
B_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
SURELEVATION = ("Surélévation possible jusqu'à R+3 (voies ≥ 12 m) ou R+4 (voies ≥ 15 m), sous condition "
                "de démolition-reconstruction. Front bâti FB4 (17,50 m), porté à R+6 sur les boulevards "
                "Mohammed VI et Mekdad Hrizi en cas de regroupement de lots (≥ 250 m²).")
I_AUT = ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"]


def a(code, extra=None):
    return zone(code, "A", "Immeubles haute densité", DEF_A, AUT_A, A_INT + ([extra] if extra else []),
                h=23.5, etages=6, surface=350, facade=18, cus=0.25,
                remarque="Hôtels et bureaux : jusqu'à 30 m (R+8). Emprise de 25 % en opération intégrée ; ni COS fixé.",
                article="zone A, art. 21-25")


def e(code, h, etages, surface, facade, cus=None, sl=None):
    note = " ".join(x for x in [
        "RDC commercial : emprise jusqu'à 100 %." if code in ("E2", "E3") else None,
        sans_lotissement(*sl) if sl else None, SURELEVATION] if x)
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, remarque=note, article="zone E, art. 35-38")


ZONES = [
    a("A6s2", "lotissements"),
    a("A6s3"),
    zone("B4", "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=17.5, etages=4, surface=250, facade=12,
         remarque="Ni COS ni emprise fixés. Logements sociaux : 60 % des unités au plus.",
         article="zone B, art. 28-31"),
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.45)),
    e("E2sr", 11.5, 2, 60, 6),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    zone("I2s1", "I", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.",
         ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"],
         [INDUSTRIE_1, "logements (sauf 1 à 3 pour la direction)", CARRIERES, PROVISOIRE],
         h=20.5, etages=4, surface=500, facade=20, article="zone I, art. 42-45"),
    zone("I5", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         I_AUT, [INDUSTRIE, LOGEMENTS, CARRIERES, PROVISOIRE],
         h=17.5, etages=3, surface=1000, facade=25, cus=0.5, article="zone I, art. 42-45"),
    zone("PJP", "PB", "Parcs et jardins publics",
         "Terrains agricoles réservés à de futurs parcs et jardins publics : inconstructibles.",
         ["activité agricole en attendant l'acquisition"], ["toute construction non agricole"],
         remarque="Emplacement réservé pour une acquisition future par la collectivité.", article="zone PJP, art. 50"),
    zone("ZR", "ZR", "Restructuration",
         "Zone en partie bâtie, à restructurer selon un plan de détail (zonage, voirie, équipements).",
         ["selon plan de restructuration approuvé"], ["construction ou lotissement avant approbation du plan"],
         surface=60,
         remarque="Les terrains libres peuvent suivre les règles de la zone E2sr (60 m² minimum).",
         article="zone ZR, art. 49"),
]
