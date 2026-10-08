# Plan d'aménagement de l'arrondissement de Sidi Belyout — fiches de zone (auc.ma).
from commun import *

NOM = "Sidi Belyout"
DOCUMENT = "PA de l'arrondissement de Sidi Belyout (AUC)"
PDF = "https://www.auc.ma"

# Les secteurs AUC « Quartier Gautier : Hmax 23,50m »… sont des quartiers de la
# zone ZUG : même règlement, hauteur plafond propre (lue dans le nom).
ALIAS = {r"^Quartier\b": "ZUG"}

ZONES = [
    zone("ZUG", "A", "Zone urbaine générale",
         "Logements, commerces, bureaux, équipements et hôtels encouragés ; hauteur plafond fixée par quartier.",
         ["habitat collectif", "commerce", "bureaux", "équipements", "hôtellerie"],
         [INDUSTRIE, "entrepôts et dépôts > 300 m² (tolérés en dessous s'ils sont liés à un commerce)", PROVISOIRE, CARRIERES],
         remarque=("Ni COS, ni emprise, ni surface minimale. Hauteur plafond par quartier : 17,50 m (Lusitania), "
                   "20,50 m (Parc & Place, Alsace-Lorraine, Liberté, Derb Omar, Foncière, Bd Mohamed V, Aviateurs), "
                   "23,50 m (Gauthier), 26,50 m (Palmier, TSF 1, Bourgogne, Bordeaux, Médina extension). "
                   "35,50 m (R+10) sur les boulevards Hassan II, d'Anfa, Moulay Youssef. Hôtels et bureaux : 2 étages de plus. "
                   "Gabarit H ≤ 1,2 × largeur de la rue."),
         article="zone ZUG, art. 9-13"),
    zone("A10", "A", "Immeubles haute densité", DEF_A, AUT_A,
         [INDUSTRIE, "entrepôts et dépôts > 1 000 m²", PROVISOIRE, CARRIERES],
         h=35.5, etages=10, remarque="Ni COS, ni emprise, ni surface minimale. Implantation à l'alignement.",
         article="zone A, art. 17-21"),
    zone("A12s", "A", "Tours sur socle",
         "Bâtiments en deux strates : socle perméable de 12,50 m (R+2) et émergences au-dessus.",
         AUT_A, [INDUSTRIE, "entrepôts et dépôts > 1 000 m²", PROVISOIRE, CARRIERES],
         h=43, etages=12, surface=2000, facade=40,
         remarque="Émergence : 35 % de l'étage supérieur du socle (50 % sous 1 000 m²), recul de 5 m. Hôtels et bureaux : 48,50 m (R+14). Façade de 40 m sur 2 voies ≥ 30 m.",
         article="zone A, art. 17-21"),
    zone("I6", "I", "Activités portuaires", "Installations liées au port de Casablanca.",
         ["activités portuaires", "service public"], ["logements (hors direction et surveillance)", CARRIERES],
         remarque="Ni COS, ni emprise, ni hauteur maximale. Recul de 5 m sur voie.", article="zone I, art. 26-29"),
    zone("PU1", "PU", "Projet urbain — Avenue Royale",
         "Programme mixte (logement, tertiaire, hôtellerie, équipements) le long de l'Avenue Royale.",
         ["projet urbain approuvé"], ["construction hors projet approuvé"], article="art. 24"),
    zone("PU2", "PU", "Projet urbain — Marina et Wissal Casa-Port",
         "Projets résidentiels, tertiaires, hôteliers et de loisirs entre l'ancienne médina et le littoral.",
         ["projet urbain approuvé"], ["construction hors projet approuvé"], article="art. 24"),
    zone("PU3", "PU", "Projet urbain — Derb Omar",
         "Pôle économique (logistique, commerce de gros) soumis à une étude spécifique.",
         ["projet urbain approuvé"], ["construction hors projet approuvé"], article="art. 24"),
    # PA de l'ancienne médina (document distinct), secteur AUC « Secteur Ancienne Medina ».
    zone("Secteur Ancienne Medina", "S", "Ancienne médina",
         "Habitat, activités économiques et tourisme ; réhabilitation du noyau patrimonial (Essouk, frange maritime, Tnakers).",
         ["habitat", "commerce", "artisanat", "services", "tourisme"],
         ["établissements industriels (toute catégorie)", "dépôts polluants ou inflammables", "sous-sols", PROVISOIRE, CARRIERES],
         h=11.5, etages=2, surface=100,
         remarque="Hauteur selon le plan : ME1 R+1 (8,50 m), ME2 R+2 (11,50 m). Construction sur la parcelle initiale, sans surface minimale ; 100 m² en cas de division ou de regroupement (200 m² pour un projet touristique). Patio d'au moins 1/6 de la parcelle (16 m² min.). Étude technique d'un BET obligatoire.",
         article="PA de l'ancienne médina, secteur ME, art. 12-15"),
    zone("ZRU", "ZR", "Rénovation urbaine",
         "Rénovation du périmètre de l'ancienne médina ouest, de l'Avenue Royale et du boulevard Sidi Mohammed Ben Abdallah.",
         ["programme de rénovation approuvé"], ["construction hors programme approuvé"], article="art. 25"),
]
