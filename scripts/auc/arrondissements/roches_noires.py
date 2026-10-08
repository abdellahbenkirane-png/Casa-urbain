# Plan d'aménagement de l'arrondissement d'Essoukhour Assawda (Roches Noires) — fiches de zone (auc.ma).
from commun import *

NOM = "Essoukhour Assawda"
DOCUMENT = "PA de l'arrondissement d'Essoukhour Assawda (AUC)"
PDF = "https://www.auc.ma"

A_INT = [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES]
E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
FB7 = "Front bâti FB7 (26,50 m, R+7, 500 m² minimum) le long de certains boulevards."


def a(code, h, etages, surface, facade, h_hotel, etages_hotel):
    return zone(code, "A", "Immeubles haute densité", DEF_A, AUT_A, A_INT, h=h, etages=etages,
                surface=surface, facade=facade,
                remarque=f"Hôtels et bureaux : jusqu'à {str(h_hotel).replace('.', ',')} m (R+{etages_hotel}). Ni COS ni emprise fixés. {FB7}",
                article="zone A, art. 9-12")


def e(code, h, etages, surface, facade, cus=None, cos=None, sl=None):
    note = " ".join(x for x in [
        "RDC commercial : emprise jusqu'à 100 %." if code in ("E2", "E3") else None,
        sans_lotissement(*sl) if sl else None,
        "Jusqu'à R+3 le long des voies ≥ 12 m et R+4 le long des voies ≥ 16 m.", FB7] if x)
    return zone(code, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=h, etages=etages,
                surface=surface, facade=facade, cus=cus, cos=cos, remarque=note, article="zone E, art. 23-26")


ZONES = [
    a("A5", 20.5, 5, 400, 18, 26.5, 7),
    a("A7", 26.5, 7, 500, 20, 35.5, 10),
    a("A10", 35.5, 10, 800, 22, 41.5, 12),
    zone("B5", "B", "Immeubles collectifs", DEF_B, MIXTE, A_INT, h=20.5, etages=5, surface=300, facade=12,
         remarque=f"Ni COS ni emprise fixés. {FB7} Hôtels et bureaux : 32,50 m (R+9) le long du boulevard Ibn Tachfine.",
         article="zone B, art. 16-19"),
    e("E2", 11.5, 2, 100, 8, 0.84, sl=(1.2, 0.40)),
    e("E3", 14.5, 3, 160, 10, 0.85, sl=(1.5, 0.40)),
    e("E4", 17.5, 4, 5000, 50, 0.35, cos=1.5),
    zone("I5s5", "I", "Activités & bureaux",
         "Bureaux, services, commerces et petites activités industrielles non nuisantes ; hôtellerie et équipements.",
         ["bureaux", "services", "commerce", "petite industrie non nuisante", "hôtellerie", "équipements"],
         ["établissements industriels de 1re et 2e catégorie", LOGEMENTS, CARRIERES, PROVISOIRE],
         h=20.5, etages=4, surface=500, facade=20,
         remarque="Ni COS ni emprise fixés. Front bâti FB9 (40 m, R+9, 1 000 m² minimum) pour bureaux et hôtels sur le boulevard El Amir Abdelkader.",
         article="zone I, art. 30-33"),
]
