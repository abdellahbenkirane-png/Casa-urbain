# Plan d'aménagement de la commune rurale de Beni Yakhlef — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Beni Yacklef"
DOCUMENT = "PA de la commune rurale de Beni Yakhlef (AUC)"
PDF = "https://www.auc.ma"

ZONES = [
    zone("B4", "B", "Immeubles collectifs", DEF_B, MIXTE, [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES],
         h=17.5, etages=4, surface=250, facade=12, remarque="Ni COS ni emprise fixés. Implantation à l'alignement.",
         article="zone B, art. 9-13"),
    *zones_naturelles(zone, codes=("CV", "RA", "RAs", "RS")),
]
