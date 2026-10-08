# Plan d'aménagement de l'arrondissement de Ben M'Sick — fiches de zone (auc.ma).
from commun import *

NOM = "Ben M'sick"
DOCUMENT = "PA de l'arrondissement de Ben M'Sick (AUC)"
PDF = "https://www.auc.ma"

A_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES, "opérations de logement social"]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
SURELEVATION = ("Surélévation possible jusqu'à R+3 (voies ≥ 12 m) ou R+4 (voies ≥ 15 m), sous condition "
                "de démolition-reconstruction. Front bâti FB4 (17,50 m) le long de certains axes.")


def a(code, extra=None):
    return zone(code, "A", "Immeubles haute densité", DEF_A, AUT_A,
                A_INT + ([extra] if extra else []),
                h=23.5, etages=6, surface=350, facade=18, cus=0.25,
                remarque="Hôtels et bureaux : jusqu'à 30 m (R+8). Emprise de 25 % en opération intégrée ; ni COS fixé. Logements sociaux : 60 % au plus de la typologie dominante.",
                article="zone A, art. 21-27")


def e(code, h, etages, surface, facade, cus, cos=None, sl=None):
    note = " ".join(x for x in [
        "RDC commercial : emprise jusqu'à 100 % en E2 et E3." if code in ("E2", "E3") else None,
        sans_lotissement(*sl) if sl else None, SURELEVATION] if x)
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT,
                h=h, etages=etages, surface=surface, facade=facade, cus=cus, cos=cos,
                remarque=note, article="zone E, art. 28-31")


ZONES = [
    a("A6s2", "lotissements"),
    a("A6s3"),
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.45)),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
]
