# Plan d'aménagement de l'arrondissement d'Al Fida — fiches de zone (auc.ma).
from commun import *

NOM = "El Fida"
DOCUMENT = "PA de l'arrondissement d'Al Fida (AUC)"
PDF = "https://www.auc.ma"

AM_DEF = "Îlots donnant sur le boulevard Mohammed VI, soumis à une étude urbanistique et architecturale spécifique."
AM_INT = [INDUSTRIE_TOUTE + ", dépôts et artisanat", PROVISOIRE, MORCELLEMENT, CARRIERES, CAVES, "accès à la terrasse"]
AM_NOTE = "Front bâti FB6 (23,50 m) et FB8 (29,50 m) le long du boulevard Mohammed VI."
B_INT = [INDUSTRIE, DEPOTS, PROVISOIRE, MORCELLEMENT, CARRIERES, "caves liées aux logements en RDC"]
E_INT = B_INT[:3] + [CARRIERES, "caves liées aux logements en RDC"]
E_NOTE = "Surélévation d'un étage possible le long des voies ≥ 12 m, sous condition de démolition-reconstruction parasismique."


def am(code, h, etages, extra_int, cos=None, cus=None, note=None):
    return zone(code, "B", "Îlots du boulevard Mohammed VI", AM_DEF,
                ["habitat collectif", "commerce", "bureaux", "services"], AM_INT + [extra_int],
                h=h, etages=etages, surface=300, facade=12, cos=cos, cus=cus,
                remarque=" ".join(x for x in [note, AM_NOTE] if x), article="zone AM, art. 21-24")


def b(code, h, etages, surface, cos, cus):
    return zone(code, "B", "Immeubles collectifs", DEF_B, MIXTE, B_INT, h=h, etages=etages,
                surface=surface, facade=12,
                remarque=sans_lotissement(cos, cus) + " Logements sociaux : 60 % des unités au plus.",
                article="zone B, art. 28-31")


def e(code, h, etages, surface, facade, cus, cos=None):
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, cos=cos,
                remarque=("RDC commercial : emprise jusqu'à 100 %. " if code != "E4" else "") + E_NOTE,
                article="zone E, art. 42-45")


ZONES = [
    am("AM4", 17.5, 4, "logements en rez-de-chaussée"),
    am("AM5", 20.5, 5, "logements en rez-de-chaussée"),
    am("AM6", 23.5, 6, "logements en rez-de-chaussée"),
    am("AM5s", 20.5, 5, "logements (hors gardiennage)", cos=2.2, cus=0.5,
       note="Opérations intégrées : COS 2,2, emprise 50 %, émergences jusqu'à 29,50 m (R+8)."),
    b("B4", 17.5, 4, 250, 1.3, 0.30),
    b("B5", 20.5, 5, 300, 1.4, 0.25),
    zone("D2s", "D", "Villas", DEF_D, AUT_D,
         [INDUSTRIE, DEPOTS, PROVISOIRE, MORCELLEMENT, CARRIERES, "accès à la terrasse"],
         h=8, etages=1, surface=250, facade=10, cus=0.5,
         remarque="Villas en bande 250 m² / 10 m (emprise 50 %), jumelées 375 m² / 15 m (40 %), isolées 500 m² / 20 m (35 %). Linéaire commercial : 11,50 m (R+2). Recul de 4 m sur voie.",
         article="zone D, art. 35-40"),
    e("E2sr", 11.5, 2, 100, 8, 0.84),
    e("E3sr", 14.5, 3, 84, 7, 0.85),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    zone("ES", "S", "Quartier Grégoire (patrimoine)",
         "Ensemble urbain remarquable (quartier Grégoire) soumis à une charte architecturale, urbaine et paysagère.",
         ["habitat", "commerce en RDC"],
         ["établissements industriels et classés", "dépôts et entrepôts > 500 m²", CARRIERES],
         h=11.5, etages=2,
         remarque="Front bâti FB3 (14,50 m) sur les voies périphériques. Commerce au RDC seulement, étages réservés à l'habitat. Ni COS, ni emprise, ni surface minimale.",
         article="zone ES, art. 49-54"),
    zone("PU", "PU", "Projet urbain",
         "Projets urbains à valider par la commission préfectorale : requalification de la centralité commerciale (marché de Koréa, Souk Debban…) et pôle de loisirs sportifs.",
         ["projet urbain approuvé"], ["construction hors projet approuvé"], article="zone PU, art. 55"),
]
