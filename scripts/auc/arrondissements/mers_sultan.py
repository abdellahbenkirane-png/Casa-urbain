# Plan d'aménagement de l'arrondissement de Mers Sultan — fiches de zone (auc.ma).
NOM = "Mers Sultan"
DOCUMENT = "PA de l'arrondissement de Mers Sultan (AUC)"
PDF = "https://www.auc.ma/wp-content/uploads/2020/05/REG-GENERAL-MERS-SULTAN.pdf"

INDUSTRIE = "établissements industriels (1re, 2e, 3e catégorie)"
DEPOTS = "dépôts et entrepôts > 300 m² (hors noyaux d'équipements)"
PROVISOIRE = "constructions provisoires, campings"
MORCELLEMENT = "morcellement des lots de lotissement"
CARRIERES = "carrières"
CAVES = "caves liées au rez-de-chaussée"
MIXTE = ["habitat collectif", "commerce", "bureaux", "hôtellerie", "artisanat", "services", "équipements"]

AM = dict(
    famille="B",
    nom="Îlots du boulevard Mohammed VI",
    description="Îlots donnant sur le boulevard Mohammed VI, soumis à une étude urbanistique et architecturale spécifique (volumes, façades, matériaux).",
    autorises=["habitat collectif", "commerce", "bureaux", "services", "équipements"],
)
AM_INTERDITS = ["établissements industriels (toute catégorie)", "dépôts et artisanat", PROVISOIRE, MORCELLEMENT, CARRIERES, CAVES]

B = dict(
    famille="B",
    nom="Immeubles collectifs",
    description="Zone urbaine mixte : logements, commerces, bureaux, hôtellerie, artisanat, services et équipements.",
    autorises=MIXTE,
    interdits=[INDUSTRIE, DEPOTS, PROVISOIRE, MORCELLEMENT, CARRIERES, CAVES],
)
B_COS = "Sans lotissement (opération d'ensemble), COS {cos} et emprise {cus} %. Logements sociaux : 60 % des unités au plus."

E = dict(
    famille="E",
    nom="Tissu existant mixte",
    description="Secteurs existants : habitations multifamiliales et immeubles à l'alignement, commerces, artisanat, bureaux, hôtellerie, équipements.",
    autorises=["habitat", "habitat collectif", "commerce", "bureaux", "artisanat", "hôtellerie", "équipements"],
    interdits=[INDUSTRIE, DEPOTS, PROVISOIRE, CARRIERES, "caves liées aux logements en RDC"],
)
E_NOTE = "Emprise au sol 84 % (100 % avec RDC commercial en E2sr et E3sr). Surélévation d'un étage possible le long des voies ≥ 12 m, sous conditions (démolition-reconstruction parasismique)."


def am(code, h, etages, terrasse=False):
    return zone(code, AM["famille"], AM["nom"], AM["description"], AM["autorises"],
                AM_INTERDITS + (["accès à la terrasse"] if terrasse else []),
                h=h, etages=etages, surface=300, facade=12,
                remarque="Hauteurs sous réserve des servitudes autour du Palais Royal.",
                article="zone AM, art. 28-32")


def b(code, h, etages, surface, facade, cos=None, cus=None, extra=""):
    note = (B_COS.format(cos=str(cos).replace(".", ","), cus=round(cus * 100)) if cos else "")
    note = " ".join(x for x in [note, extra] if x)
    return zone(code, B["famille"], B["nom"], B["description"], B["autorises"], B["interdits"],
                h=h, etages=etages, surface=surface, facade=facade, remarque=note or None,
                article="zone B, art. 35-39")


def e(code, h, etages, surface, facade, terrasse=False):
    return zone(code, E["famille"], E["nom"], E["description"], E["autorises"],
                E["interdits"] + (["accès aux terrasses"] if terrasse else []),
                h=h, etages=etages, surface=surface, facade=facade, cus=0.84, remarque=E_NOTE,
                article="zone E, art. 49-52")


ZONES = [
    am("AM1", 8, 1, terrasse=True),
    am("AM2", 11.5, 2, terrasse=True),
    am("AM3", 14.5, 3, terrasse=True),
    am("AM4", 17.5, 4),
    am("AM5", 20.5, 5),
    b("B2s", 11.5, 2, 200, 10, extra="Recul de 4 m sur voie, traité en jardin."),
    b("B3", 14.5, 3, 200, 10, cos=1.2, cus=0.35),
    b("B4", 17.5, 4, 250, 12, cos=1.3, cus=0.30),
    b("B5", 20.5, 5, 300, 14, cos=1.4, cus=0.25,
      extra="Front bâti FB7 (26,50 m, R+7) le long du boulevard Oulad Ziane."),
    zone("D2s", "D", "Villas",
         "Habitat individuel : villas en bande, jumelées ou isolées. Commerces de proximité, bureaux et hôtels possibles en noyaux indépendants.",
         ["habitat individuel", "commerce de proximité (noyaux)", "bureaux", "équipements hôteliers"],
         [INDUSTRIE, DEPOTS, PROVISOIRE, MORCELLEMENT, CARRIERES, "accès à la terrasse"],
         h=8, etages=1, surface=200, facade=10, cus=0.5,
         remarque="Villas en bande 200 m² / 10 m (emprise 50 %), jumelées 300 m² / 15 m (40 %), isolées 360 m² / 18 m (40 %). Recul de 4 m sur voie et en limites séparatives.",
         article="zone D, art. 42-48"),
    e("E1sr", 8, 1, 100, 8, terrasse=True),
    e("E2sr", 11.5, 2, 100, 8),
    e("E3sr", 14.5, 3, 84, 7),
    zone("ES", "S", "Derb Bousbir (patrimoine)",
         "Ensemble urbain remarquable inscrit au patrimoine national, soumis à une charte architecturale et paysagère.",
         ["habitat", "commerce", "artisanat"],
         ["établissements industriels et classés", "dépôts et entrepôts > 500 m²", CARRIERES],
         h=8, etages=1,
         remarque="Ni COS, ni emprise, ni surface minimale : constructibilité limitée par la hauteur et le prospect.",
         article="zone ES, art. 56-61"),
    zone("ZUG", "A", "Zone urbaine générale",
         "Logements, commerces, bureaux, équipements et hôtels encouragés.",
         ["habitat collectif", "commerce", "bureaux", "équipements", "hôtellerie"],
         [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES],
         h=20, etages=5,
         remarque="Hauteur indiquée sur le plan : 20 m (R+5), 23 m (R+6) ou 26 m (R+7) selon les filets de hauteur. Le simulateur part de R+5. Ni COS, ni emprise, ni surface minimale.",
         article="zone ZUG, art. 21-24"),
]
