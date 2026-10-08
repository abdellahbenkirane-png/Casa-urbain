# Plan d'aménagement du secteur Aïn Harrouda centre (et Zenata) — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Ain Harrouda"
DOCUMENT = "PA du secteur Aïn Harrouda centre (AUC)"
PDF = "https://www.auc.ma"

I_INT = [INDUSTRIE_1, "logements (hors gardiennage, logements de fonction et résidences d'internes)", CARRIERES, PROVISOIRE]

ZONES = [
    *zones_e_standard(zone, "zone E, art. 9-12"),
    zone("I5", "I", "Activités & bureaux",
         "Activités tertiaires, commerciales, d'enseignement et de recherche ; hôtellerie, hôpitaux et équipements.",
         ["tertiaire", "commerce", "bureaux", "enseignement", "hôtellerie", "santé", "équipements"], I_INT,
         h=17.5, etages=3, surface=1000, facade=30, cus=0.5, article="zone I, art. 16-19"),
    zone("I8", "I", "Parc logistique", "Transbordement et stockage de marchandises.",
         ["logistique", "entrepôts"], I_INT, h=17.5, etages=3, surface=5000, facade=60, cus=0.5,
         article="zone I, art. 16-19"),
    *zones_naturelles(zone, codes=("CV", "RS", "RC")),
]
