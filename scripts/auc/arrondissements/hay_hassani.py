# Plan d'aménagement de l'arrondissement de Hay Hassani — fiches de zone (auc.ma).
from commun import *

NOM = "Hay Hassani"
DOCUMENT = "PA de l'arrondissement de Hay Hassani (AUC)"
PDF = "https://www.auc.ma"

B_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
C_INT = ["établissements industriels et dépôts (toute nature)", PROVISOIRE, DEPOTS, CARRIERES]
D_INT = [INDUSTRIE, DEPOTS, "commerces sur les lots de villas (sauf indication au plan)", PROVISOIRE, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
SOCIAL = "Logements sociaux : 60 % des unités au plus."
PB_DEF = ("Transition entre bâti et espace naturel : un tiers de la parcelle reste non constructible "
          "(bande verte cédée), les deux tiers restants sont valorisés en îlots ouverts.")
PB_NOTE = "Emprise calculée sur les deux tiers constructibles de la parcelle."
I_INT = [INDUSTRIE, LOGEMENTS, CARRIERES, PROVISOIRE]


def b(code, h, etages, surface):
    return zone(code, "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=h, etages=etages,
                surface=surface, facade=12,
                remarque=f"Ni COS ni emprise fixés. Front bâti FB5 (20,50 m) le long de certains axes. {SOCIAL}",
                article="zone B, art. 21-24")


def c(code, cos, cus, surface, facade, h, etages):
    return zone(code, "C", "Immeubles sur espaces verts", DEF_C, AUT_C, C_INT, h=h, etages=etages,
                surface=surface, facade=facade, cos=cos, cus=cus,
                remarque=f"Recul de 4 m sur voie, H/2 (8 m min.) en limites séparatives. {SOCIAL}",
                article="zone C, art. 28-33")


def d(code, surface, facade, cus, detail, terrasse=True):
    return zone(code, "D", "Villas", DEF_D, AUT_D, D_INT + ([] if terrasse else ["accès aux terrasses"]),
                h=8.5, etages=1, surface=surface, facade=facade, cus=cus,
                remarque=f"{detail} Villégiature : 10 000 m² / 60 m, 18 unités/ha.",
                article="zone D, art. 35-39")


def e(code, h, etages, surface, facade, cus=None, cos=None, sl=None):
    note = " ".join(x for x in [
        "RDC commercial : emprise jusqu'à 100 %." if code in ("E2", "E3", "E3s") else None,
        sans_lotissement(*sl) if sl else None,
        "Fronts bâtis FB3 (14,50 m) et FB5 (20,50 m) le long de certains axes.", SOCIAL] if x)
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, cos=cos, remarque=note,
                article="zone E, art. 42-45")


def pb(code, famille, nom, autorises, cos, cus, h, etages):
    return zone(code, famille, nom, PB_DEF, autorises, C_INT, h=h, etages=etages,
                surface=10000, facade=60, cos=cos, cus=cus,
                remarque=PB_NOTE + (" COS calculé sur les deux tiers constructibles." if cos else ""),
                article="zone PB, art. 49-52")


ZONES = [
    b("B4", 17.5, 4, 250),
    b("B4s", 17.5, 4, 300),
    b("B5", 20.5, 5, 300),
    c("C3", 1.2, 0.35, 5000, 40, 14.5, 3),
    c("C4", 1.3, 0.30, 10000, 60, 17.5, 4),
    d("D1", 200, 10, 0.5, "Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %)."),
    d("D2", 400, 20, 0.35, "Villas isolées 400 m² / 20 m (emprise 35 %).", terrasse=False),
    d("D3", 600, 22, 0.35, "Villas isolées 600 m² / 22 m (emprise 35 %). Commerces le long du boulevard d'Azemmour : 11,50 m (R+2).", terrasse=False),
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.45)),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    e("E3s", 14.5, 3, 84, 7),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    zone("I5H1", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"], I_INT,
         h=20, etages=4, surface=1000, facade=30, cus=0.5,
         remarque="Hôtels : 24 m (R+5).", article="zone I, art. 56-59"),
    zone("I5s1", "I", "Activités & bureaux",
         "Bureaux, services, commerces et petites activités industrielles non nuisantes ; hôtellerie et équipements.",
         ["bureaux", "services", "commerce", "petite industrie non nuisante", "hôtellerie"], I_INT,
         h=20, etages=4, surface=1000, facade=30, cus=0.5, article="zone I, art. 56-59"),
    pb("PBC3", "PB", "Bande verte — immeubles", AUT_C, 1.4, 0.35, 17.5, 3),
    pb("PBC5", "PB", "Bande verte — immeubles", AUT_C, 1.8, 0.30, 20.5, 5),
    pb("PBD3", "PB", "Bande verte — villas", AUT_D, None, 0.35, 8.5, 1),
    zone("ZR", "ZR", "Restructuration",
         "Zone en partie bâtie, à restructurer selon un plan de détail (zonage, voirie, équipements).",
         ["selon plan de restructuration approuvé"], ["construction ou lotissement avant approbation du plan"],
         remarque="En cas d'abandon du programme, le zonage limitrophe s'applique.", article="zone ZR, art. 64"),
]
