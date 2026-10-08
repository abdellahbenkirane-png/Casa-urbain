# Plan d'aménagement de l'arrondissement de Sidi Bernoussi — fiches de zone (auc.ma).
from commun import *

NOM = "Sidi Bernoussi"
DOCUMENT = "PA de l'arrondissement de Sidi Bernoussi (AUC)"
PDF = "https://www.auc.ma"

A_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES, "opérations de logement social"]
C_INT = ["établissements industriels et dépôts (toute nature)", PROVISOIRE, DEPOTS, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
SOCIAL = "Logements sociaux : 60 % des unités au plus."
I_LOG = "logements (sauf 1 à 3 pour la direction)"


def a(code, extra=None):
    return zone(code, "A", "Immeubles haute densité", DEF_A, AUT_A, A_INT + ([extra] if extra else []),
                h=23.5, etages=6, surface=350, facade=18, cus=0.25,
                remarque="Hôtels et bureaux : jusqu'à 30 m (R+8). Emprise de 25 % après déduction des équipements ; ni COS fixé. Mixité sociale : 60 % au plus de la typologie dominante (modification du PA).",
                article="zone A, art. 21-24")


def c(code, cos, cus, surface, facade, h, etages):
    return zone(code, "C", "Immeubles sur espaces verts", DEF_C, AUT_C, C_INT, h=h, etages=etages,
                surface=surface, facade=facade, cos=cos, cus=cus,
                remarque=f"Recul de 4 m sur voie, H/2 (8 m min.) en limites séparatives. {SOCIAL}",
                article="zone C, art. 28-31")


def e(code, h, etages, surface, facade, cus, cos=None, sl=None):
    note = " ".join(x for x in [
        "RDC commercial : emprise jusqu'à 100 %." if code in ("E2", "E3") else None,
        sans_lotissement(*sl) if sl else None,
        "Front bâti FB4 (17,50 m) le long de certains axes.", SOCIAL] if x)
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, cos=cos, remarque=note, article="zone E, art. 42-45")


def i(code, nom, description, autorises, interdits, h, etages, surface, facade, cus=0.5, article="zone I, art. 49-52"):
    return zone(code, "I", nom, description, autorises, interdits, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, article=article)


IND = ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"]
ZONES = [
    a("A6s2", "lotissements"),
    a("A6s3"),
    c("C3", 1.2, 0.35, 5000, 40, 14.5, 3),
    c("C4", 1.3, 0.30, 10000, 60, 17.5, 4),
    zone("D1s1", "D", "Villas", DEF_D, AUT_D,
         [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES],
         h=8.5, etages=1, surface=250, facade=10, cus=0.5,
         remarque="Villas en bande 250 m² / 10 m (emprise 50 %), jumelées 375 m² / 15 m (40 %), isolées 500 m² / 20 m (40 %). Recul de 4 m sur voie. Cliniques : 11,50 m.",
         article="zone D, art. 35-38"),
    zone("D1s2", "D", "Maisons en bande", DEF_D, AUT_D,
         [INDUSTRIE, DEPOTS, "commerces sur les lots (sauf indication au plan)", PROVISOIRE, CARRIERES],
         h=9.5, etages=2, surface=120, facade=8, cus=0.84,
         remarque="Maisons en bande 120 m² / 8 m (emprise 84 %), selon le plan masse du lotissement autorisé.",
         article="zone D, art. 35-38"),
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.45)),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    i("I2", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.", IND,
      [INDUSTRIE_1, I_LOG, CARRIERES, PROVISOIRE], 20.5, 4, 1000, 30),
    i("I2s1", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.", IND,
      [INDUSTRIE_1, I_LOG, CARRIERES, PROVISOIRE], 20.5, 4, 500, 20, cus=None,
      article="modification du PA, zone I, art. 35-38"),
    i("I3", "Petite industrie", "Activités industrielles de 3e catégorie.", ["industrie 3e catégorie", "artisanat"],
      ["établissements industriels de 1re et 2e catégorie", LOGEMENTS, CARRIERES, PROVISOIRE], 14.5, 3, 360, 12, cus=0.6),
    i("I5s4", "Activités & bureaux", "Bureaux, services, commerces et industrie non polluante de 2e et 3e catégorie.",
      ["bureaux", "services", "commerce", "industrie non polluante"],
      [INDUSTRIE_1, "logements (hors gardiennage)", CARRIERES, PROVISOIRE], 20.5, 4, 1000, 30, cus=None,
      article="modification du PA, zone I, art. 35-38"),
]
