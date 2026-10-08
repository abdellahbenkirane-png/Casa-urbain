# Plan d'aménagement de l'arrondissement de Moulay Rachid — fiches de zone (auc.ma).
from commun import *

NOM = "Moulay R'Chid"
DOCUMENT = "PA de l'arrondissement de Moulay Rachid (AUC)"
PDF = "https://www.auc.ma"

B_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
SOCIAL = "Logements sociaux : 60 % des unités au plus."
SURELEVATION = ("Surélévation possible jusqu'à R+3 (voies ≥ 12 m) ou R+4 (voies ≥ 15 m), sous condition "
                "de démolition-reconstruction. Front bâti FB5 (20,50 m) le long de certains axes.")
I_AUT = ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"]
I_LOG = "logements (sauf 1 à 3 pour la direction)"


def e(code, h, etages, surface, facade, cus=None, cos=None, sl=None):
    note = " ".join(x for x in [
        "RDC commercial : emprise jusqu'à 100 %." if code in ("E2", "E3", "E3s") else None,
        sans_lotissement(*sl) if sl else None, SURELEVATION, SOCIAL] if x)
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, cos=cos, remarque=note, article="zone E, art. 42-45")


def i(code, nom, description, autorises, interdits, h, etages, surface, facade, cus, extra=None):
    return zone(code, "I", nom, description, autorises, interdits, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus,
                remarque=" ".join(x for x in [extra, "Recul de 5 m sur voie et en limites séparatives."] if x),
                article="zone I, art. 49-52")


ZONES = [
    zone("A7s", "A", "Immeubles haute densité", DEF_A, AUT_A,
         B_INT + ["opérations de logement social"], h=26.5, etages=7, surface=500, facade=20,
         remarque="Ni COS ni emprise fixés. Mixité sociale : 70 % au plus de la typologie dominante.",
         article="zone A, art. 21-24"),
    zone("B3s", "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=14.5, etages=3, surface=300, facade=12,
         remarque=f"Ni COS ni emprise fixés. {SOCIAL}", article="zone B, art. 28-31"),
    zone("B4", "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=17.5, etages=4, surface=250, facade=12,
         remarque=f"Ni COS ni emprise fixés. {SOCIAL}", article="zone B, art. 28-31"),
    zone("D1", "D", "Villas", DEF_D, AUT_D,
         [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES],
         h=8, etages=1, surface=200, facade=10, cus=0.5,
         remarque="Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %).",
         article="zone D, art. 35-37"),
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.45)),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    e("E3s", 14.5, 3, 84, 7),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    e("E5", 20.5, 5, 5000, 50, 0.35, cos=2.0),
    i("I2s1", "Activités industrielles", "Activités industrielles de 2e et 3e catégorie.",
      ["industrie 2e et 3e catégorie", "artisanat", "entrepôts"],
      [INDUSTRIE_1, I_LOG, CARRIERES, PROVISOIRE], 20.5, 4, 1000, 30, 0.5),
    i("I3s1", "Petite industrie", "Activités industrielles de 3e catégorie.",
      ["industrie 3e catégorie", "artisanat"],
      ["établissements industriels de 1re et 2e catégorie", LOGEMENTS, CARRIERES, PROVISOIRE],
      6, 0, 192, 12, 0.5, extra="Rez-de-chaussée seul (6 m)."),
    i("I5h", "Activités & bureaux",
      "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
      I_AUT, [INDUSTRIE, LOGEMENTS, CARRIERES, PROVISOIRE], 17.5, 3, 1000, 30, 0.5),
    i("I5s4", "Activités & bureaux", "Bureaux, services, commerces et petites activités industrielles non nuisantes.",
      ["bureaux", "services", "commerce", "petite industrie non nuisante"],
      [INDUSTRIE_1, I_LOG, CARRIERES, PROVISOIRE], 17.5, 3, 500, 20, 0.4),
    zone("GPSL", "PB", "Sport et loisirs de plein air",
         "Espace ouvert protégé pour le sport et les loisirs (golfs, hippodromes, plaines de jeux), 20 % accessible au public.",
         ["sport et loisirs", "équipements touristiques"],
         ["morcellement", "habitation et hôtels", "dépôts et hangars", "industrie", CARRIERES],
         h=5, etages=0,
         remarque="Constructions légères limitées à 10 % de la parcelle (1 000 m² au plus). Établissements touristiques : 11,50 m (R+2).",
         article="zone GPSL, art. 57-60"),
    zone("PJP", "PB", "Parcs et jardins publics",
         "Terrains agricoles réservés à de futurs parcs et jardins publics : inconstructibles.",
         ["activité agricole en attendant l'acquisition"], ["toute construction non agricole"],
         remarque="Emplacement réservé pour une acquisition future par la collectivité.", article="zone PJP"),
    zone("ZR", "ZR", "Restructuration",
         "Zone en partie bâtie, à restructurer selon un plan de détail (zonage, voirie, équipements).",
         ["selon plan de restructuration approuvé"], ["construction ou lotissement avant approbation du plan"],
         remarque="En cas d'abandon du programme, le zonage limitrophe s'applique.", article="zone ZR"),
]
