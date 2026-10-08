# Plan d'aménagement de l'arrondissement de Maârif (2026) — fiches de zone (auc.ma).
from commun import *

NOM = "Maarif"
DOCUMENT = "PA de l'arrondissement de Maârif (AUC, 2026)"
PDF = "https://www.auc.ma"

A_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
B_INT = [INDUSTRIE, DEPOTS, PROVISOIRE, MORCELLEMENT, CARRIERES, "caves liées aux logements en RDC"]
C_INT = ["établissements industriels et dépôts (toute nature)", PROVISOIRE, DEPOTS, CARRIERES,
         "caves liées aux logements en RDC"]
D_INT = [INDUSTRIE, DEPOTS, PROVISOIRE, MORCELLEMENT, CARRIERES, "mezzanines", "accès à la terrasse"]
SOCIAL = "Logements sociaux : 60 % des unités au plus."
A_NOTE = ("Hauteur déduite du code de zone (l'article sur les hauteurs n'est pas dans les fiches publiées) : "
          "à confirmer sur le règlement complet.")
PALAIS = "Hauteurs sous réserve des servitudes autour du Palais Royal et de la Demeure Royale."


def a(code, h, etages, extra=""):
    return zone(code, "A", "Immeubles haute densité", DEF_A, AUT_A, A_INT, h=h, etages=etages,
                remarque=" ".join(x for x in [A_NOTE, extra,
                                              "Implantation à l'alignement partiel (60 % du linéaire d'îlot)."] if x),
                article="zone A, art. 32-34")


def b(code, h, etages, surface, recul=False):
    note = ("Ni COS ni emprise fixés. Hôtels : 2 étages supplémentaires sur les voies ≥ 30 m. "
            + ("Recul de 4 m sur voie, cédé à la voirie. " if recul else "Implantation à l'alignement. ") + SOCIAL)
    return zone(code, "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=h, etages=etages,
                surface=surface, facade=12, remarque=note, article="zone B, art. 35-39")


def c(code, cos, cus, surface, facade, h, etages):
    return zone(code, "C", "Immeubles sur espaces verts", DEF_C, AUT_C, C_INT, h=h, etages=etages,
                surface=surface, facade=facade, cos=cos, cus=cus,
                remarque=f"Recul de 4 m sur voie, H/2 (8 m min.) en limites séparatives. {SOCIAL}",
                article="zone C, art. 42-46")


def d(code, surface, facade, cus, detail):
    return zone(code, "D", "Villas", DEF_D, AUT_D, D_INT, h=8, etages=1, surface=surface, facade=facade, cus=cus,
                remarque=f"{detail} Recul de 5 m sur voie (4 m en D2). Villégiature : 10 000 m² / 60 m, 18 unités/ha. {PALAIS}",
                article="zone D, art. 49-53")


ZONES = [
    a("A5s1", 20.5, 5, "Prospect H ≤ 1,5 × L."),
    a("A7", 26.5, 7),
    a("A10", 35.5, 10, "Front du boulevard Roudani."),
    b("B3", 14.5, 3, 250),
    b("B3s", 14.5, 3, 300, recul=True),
    b("B4", 17.5, 4, 250),
    b("B4s", 17.5, 4, 300, recul=True),
    b("B5", 20.5, 5, 300),
    c("C2", 1.0, 0.40, 5000, 40, 11.5, 2),
    c("C3", 1.2, 0.35, 5000, 40, 14.5, 3),
    c("C4", 1.3, 0.30, 10000, 50, 17.5, 4),
    c("C5", 1.4, 0.25, 10000, 50, 20.5, 5),
    d("D2", 400, 20, 0.35, "Villas isolées 400 m² / 20 m (emprise 35 %)."),
    d("D2s2", 300, 15, 0.40, "Villas jumelées 300 m² / 15 m (40 %), isolées 400 m² / 20 m (35 %)."),
    d("D3", 600, 22, 0.35, "Villas isolées 600 m² / 22 m (emprise 35 %)."),
    d("D4", 1000, 25, 0.25, "Villas isolées 1 000 m² / 25 m (emprise 25 %)."),
    zone("I5H", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"],
         [INDUSTRIE, LOGEMENTS, CARRIERES, PROVISOIRE],
         h=28.5, etages=6, surface=1000, facade=30, cus=0.5,
         remarque="Hôtels : 36 m (R+8).", article="zone I, art. 56-59"),
    zone("ZUG", "A", "Zone urbaine générale",
         "Logements, commerces, bureaux, équipements et hôtels encouragés.",
         ["habitat collectif", "commerce", "bureaux", "équipements", "hôtellerie"],
         [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES],
         h=26, etages=7,
         remarque="Filets de hauteur au plan : R+7 (26 m) boulevards Zerktouni et d'Anfa, R+9 (32 m) boulevard Abdelmoumen, R+5 (20 m) ailleurs. Le simulateur part de R+7. Bande constructible de 16,50 m.",
         article="zone ZUG, art. 24-27"),
    zone("PU1", "PU", "Projet urbain — quartier des hôpitaux",
         "Réaménagement du quartier des hôpitaux (CHU Ibn Rochd, facultés, Institut Pasteur), 56 ha.",
         ["projet urbain approuvé"], ["construction hors projet approuvé"], article="art. 63"),
    zone("PU2", "PU", "Projet urbain — secteur Bachkou",
         "Projet intégré d'environ 11 ha au sud de l'arrondissement, avec parking public en ouvrage.",
         ["projet urbain approuvé"], ["construction hors projet approuvé"], article="art. 63"),
    zone("ZPA", "ZR", "Projets autorisés",
         "Cités Riviera Beaulieu, Anfa II et III, Plateau, Romandie : règles des plans déjà autorisés à préserver.",
         ["réhabilitation", "construction conforme au projet autorisé"], ["construction hors règles du projet autorisé"],
         article="art. 64"),
    zone("SRU", "ZR", "Rénovation urbaine",
         "Secteur de bâtisses vétustes à rénover (équipements, espaces verts, commerces), selon une étude spécifique.",
         ["programme de rénovation approuvé"], ["construction hors programme approuvé"], article="art. 65"),
]
