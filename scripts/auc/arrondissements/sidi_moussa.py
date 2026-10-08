# Plans d'aménagement des communes rurales de Sidi Moussa Ben Ali et Sidi Moussa Majdoub — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Sidi Moussa Ben Ali"
DOCUMENT = "PA de la commune rurale de Sidi Moussa Ben Ali (AUC)"
PDF = "https://www.auc.ma"

E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
RDC = "RDC commercial : emprise jusqu'à 100 %. Lotissements : 5 % du terrain en espaces libres plantés."

ZONES = [
    zone("C3", "C", "Immeubles sur espaces verts", DEF_C, AUT_C,
         ["établissements industriels et dépôts (toute nature)", "commerces incorporés à l'immeuble", PROVISOIRE, DEPOTS, CARRIERES],
         h=14.5, etages=3, surface=5000, facade=40, cos=1.2, cus=0.35, article="zone C, art. 9-12"),
    zone("E2", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=11.5, etages=2, surface=100, facade=8, cus=0.84,
         remarque=RDC, article="zone E, art. 23-26"),
    zone("E2s", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=11.5, etages=2, surface=60, facade=6, cus=0.84,
         remarque=RDC, article="zone E, art. 23-26"),
    zone("E3s", "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, h=14.5, etages=3, surface=84, facade=7,
         remarque=RDC, article="zone E, art. 23-26"),
    *zones_naturelles(zone, codes=("CV", "RA")),
]
