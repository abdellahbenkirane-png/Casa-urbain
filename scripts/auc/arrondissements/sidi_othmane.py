# Plan d'aménagement de l'arrondissement de Sidi Othmane — fiches de zone (auc.ma).
from commun import *

NOM = "Sidi Othmane"
DOCUMENT = "PA de l'arrondissement de Sidi Othmane (AUC)"
PDF = "https://www.auc.ma"

E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
SURELEVATION = ("Surélévation possible jusqu'à R+3 (voies ≥ 12 m) ou R+4 (voies ≥ 15 m), sous condition "
                "de démolition-reconstruction. Front bâti FB4 (17,50 m) le long de certains axes.")


def e(code, h, etages, surface, facade, cus=None, cos=None, sl=None):
    note = " ".join(x for x in [
        "RDC commercial : emprise jusqu'à 100 %." if code in ("E2", "E3") else None,
        sans_lotissement(*sl) if sl else None, SURELEVATION] if x)
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, cos=cos, remarque=note,
                article="zone E, art. 21-24")


ZONES = [
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.40)),
    e("E2sr", 11.5, 2, 60, 6),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    zone("I5", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "équipements"],
         [INDUSTRIE, LOGEMENTS, CARRIERES, PROVISOIRE],
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5,
         remarque="Recul de 5 m sur voie. Hauteur sous plafond des locaux d'activité : 4 m minimum.",
         article="zone I, art. 28-32"),
]
