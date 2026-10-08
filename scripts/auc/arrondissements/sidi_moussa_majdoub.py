# Plan d'aménagement de la commune rurale de Sidi Moussa Ben Majdoub — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Sidi Moussa Ben Mejdoub"
DOCUMENT = "PA de la commune rurale de Sidi Moussa Ben Majdoub (AUC)"
PDF = "https://www.auc.ma"

ZONES = [
    zone("E3s", "E", "Tissu existant mixte", DEF_E, AUT_E,
         [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES],
         h=14.5, etages=3, surface=84, facade=7,
         remarque="Lotissements : 5 % du terrain en espaces libres plantés. Implantation à l'alignement.", article="zone E, art. 9-13"),
    *zones_naturelles(zone, codes=("CV", "RA", "RAs")),
]
