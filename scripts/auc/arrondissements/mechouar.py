# Plan d'aménagement de la commune du Méchouar — fiches de zone (auc.ma).
from commun import *

NOM = "Commune Mechouar"
DOCUMENT = "PA de la commune du Méchouar (AUC)"
PDF = "https://www.auc.ma"

PALAIS = "Hauteurs sous réserve des servitudes autour du Palais Royal."
AM_DEF = "Îlots donnant sur le boulevard Mohammed VI, soumis à une étude urbanistique et architecturale spécifique."
AM_INT = [INDUSTRIE_TOUTE + ", dépôts et artisanat", PROVISOIRE, CARRIERES, "accès à la terrasse"]


def am(code, h, etages):
    return zone(code, "B", "Îlots du boulevard Mohammed VI", AM_DEF,
                ["habitat collectif", "commerce", "bureaux", "services"], AM_INT,
                h=h, etages=etages, surface=300, facade=12,
                remarque=f"Ni COS ni emprise fixés. Hauteur imposée dans la bande de 15 m le long du boulevard Mohammed VI et de la route de Sauternes. {PALAIS}",
                article="zone AM, art. 9-12")


ZONES = [
    am("AM1", 7, 1),
    am("AM2", 11, 2),
    am("AM3", 14, 3),
    zone("B3s", "B", "Immeubles collectifs", DEF_B, MIXTE, [INDUSTRIE, "entrepôts et dépôts > 300 m²", PROVISOIRE, CARRIERES],
         h=14, etages=3, surface=300, facade=12,
         remarque=f"Ni COS ni emprise fixés. Recul de 4 m sur voie, cédé à la voirie. {PALAIS}",
         article="zone B, art. 16-20"),
    zone("D2Sh", "D", "Villas sur petites parcelles",
         "Habitat individuel exclusivement : villas isolées sur des parcelles de petites dimensions.",
         ["habitat individuel"], [INDUSTRIE, "dépôts et entrepôts", "commerces et bureaux", PROVISOIRE, CARRIERES, "accès aux terrasses"],
         h=8, etages=1, surface=360, facade=18, cus=0.4,
         remarque=f"Villas isolées 360 m² / 18 m (emprise 40 %). Recul de 4 m sur voie, traité en jardin. {PALAIS}",
         article="zone D, art. 23-27"),
    zone("SH", "S", "Quartier des Habous (patrimoine)",
         "Secteur des Habous : constructions existantes à maintenir dans leur aspect, prescriptions architecturales strictes.",
         ["habitat", "commerce traditionnel (kissarias)"], ["modification de l'aspect des façades", "couvertures en tôle ou matériaux légers"],
         remarque="Façades enduites et blanchies à la chaux, menuiseries bois, portes sur le modèle d'origine. Le simulateur ne s'applique qu'à titre indicatif.",
         article="secteur SH, art. 30-31"),
]
