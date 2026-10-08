"""Libellés communs aux fiches de zone AUC (repris d'un arrondissement à l'autre)."""
INDUSTRIE = "établissements industriels (1re, 2e, 3e catégorie)"
INDUSTRIE_TOUTE = "établissements industriels (toute catégorie)"
INDUSTRIE_1 = "établissements industriels de 1re catégorie"
DEPOTS = "dépôts et entrepôts > 300 m² (hors noyaux d'équipements)"
PROVISOIRE = "constructions provisoires, campings"
MORCELLEMENT = "morcellement des lots de lotissement"
CARRIERES = "carrières"
CAVES = "caves liées au rez-de-chaussée"
LOGEMENTS = "logements (hors gardiennage)"
MIXTE = ["habitat collectif", "commerce", "bureaux", "hôtellerie", "artisanat", "services", "équipements"]

DEF_A = "Zone urbaine où logements, commerces, bureaux et hôtels sont encouragés."
DEF_B = "Zone urbaine mixte : logements, commerces, bureaux, hôtellerie, artisanat, services et équipements."
DEF_C = "Ensembles de logements collectifs en immeubles orientés ; commerces, bureaux et hôtels en noyaux indépendants."
DEF_D = "Habitat individuel : villas isolées, jumelées ou en bande ; commerces de proximité en noyaux indépendants."
DEF_E = "Secteurs existants : habitations multifamiliales et immeubles à l'alignement, commerces, artisanat, bureaux, hôtellerie."
DEF_CV = "Ceinture verte : espace ouvert à préserver (espaces verts, sports, bassins, agriculture)."
DEF_RC = "Protection du domaine maritime : servitude non aedificandi, aucune construction."

AUT_A = ["habitat collectif", "commerce", "bureaux", "hôtellerie"]
AUT_C = ["habitat collectif", "commerce de proximité (noyaux)", "bureaux", "équipements hôteliers"]
AUT_D = ["habitat individuel", "commerce de proximité (noyaux)", "bureaux", "équipements hôteliers"]
AUT_E = ["habitat", "habitat collectif", "commerce", "bureaux", "artisanat", "hôtellerie", "équipements"]

SANS_LOTISSEMENT = "Sans lotissement (opération d'ensemble), COS {cos} et emprise {cus} %."


def sans_lotissement(cos, cus):
    return SANS_LOTISSEMENT.format(cos=str(cos).replace(".", ","), cus=round(cus * 100))


# Zones non constructibles ou agricoles, identiques d'une commune à l'autre.
NON_CONSTR = "Zone non constructible pour l'habitat : le simulateur d'immeuble ne s'applique pas."


def zones_naturelles(zone, article="", codes=("CV", "FR", "RA", "RS", "TVR", "PJP", "ZR", "RC")):
    z = {
        "CV": zone("CV", "PB", "Ceinture verte", DEF_CV,
                   ["espaces verts", "sports et loisirs", "cimetières", "bassins de retenue", "agriculture"],
                   ["habitat", "lotissements", "dépôts et hangars", "industrie", CARRIERES], remarque=NON_CONSTR, article=article),
        "FR": zone("FR", "PB", "Forêt et sites naturels",
                   "Milieux naturels protégés ; aménagements d'accueil du public non clos sur 20 % du massif au plus.",
                   ["accueil du public (pistes, pique-nique, jeux)"], ["toute construction"], remarque=NON_CONSTR, article=article),
        "RA": zone("RA", "PB", "Zone rurale (agricole)",
                   "Terrains à vocation strictement agricole : habitat des exploitants et bâtiments agricoles.",
                   ["exploitation agricole", "habitat de l'exploitant"],
                   ["lotissements et groupes d'habitations", "dépôts et hangars", "industrie", "bureaux et commerces", CARRIERES],
                   remarque=NON_CONSTR, article=article),
        "RS": zone("RS", "ZR", "Réserve foncière (surveillance)",
                   "Zone non équipée destinée à l'extension future de l'agglomération, après un plan d'aménagement sectoriel.",
                   [], ["toute construction ou lotissement avant ouverture à l'urbanisation"], remarque=NON_CONSTR, article=article),
        "TVR": zone("TVR", "PB", "Trame verte rurale",
                    "Espace rural ouvert à préserver ; une seule habitation par parcelle de 10 ha (200 m² au sol, 2 %).",
                    ["agriculture", "espaces verts", "sports et loisirs"],
                    ["lotissements", "dépôts et hangars non agricoles", "industrie", CARRIERES],
                    surface=100000, facade=150, remarque=NON_CONSTR, article=article),
        "PJP": zone("PJP", "PB", "Parcs et jardins publics",
                    "Terrains réservés à de futurs parcs et jardins publics : inconstructibles.",
                    ["activité agricole en attendant l'acquisition"], ["toute construction non agricole"],
                    remarque=NON_CONSTR, article=article),
        "ZR": zone("ZR", "ZR", "Restructuration",
                   "Zone en partie bâtie, à restructurer selon un plan de détail (zonage, voirie, équipements).",
                   ["selon plan de restructuration approuvé"], ["construction ou lotissement avant approbation du plan"],
                   article=article),
        "ZNAP": zone("ZNAP", "ZR", "Gisements de calcaire (non aedificandi)",
                     "Servitude non aedificandi : gisements de calcaire cimentier à préserver.",
                     [], ["toute construction", "morcellement à fins immobilières"], remarque=NON_CONSTR, article=article),
        "RAs": zone("RAs", "PB", "Zone rurale (agricole)",
                    "Terrains à vocation agricole : habitat des exploitants et bâtiments agricoles.",
                    ["exploitation agricole", "habitat de l'exploitant"],
                    ["lotissements et groupes d'habitations", "dépôts et hangars", "industrie", CARRIERES],
                    remarque=NON_CONSTR, article=article),
        "RC": zone("RC", "ZR", "Protection du domaine maritime", DEF_RC, [], ["toute construction"],
                   remarque="Servitude non aedificandi : aucune construction ni installation.", article=article),
    }
    return [z[c] for c in codes]


def zones_e_standard(zone, article, codes=("E2", "E3", "E4"), note=None):
    """Secteurs E2 / E3 / E4 au gabarit commun des PA de l'AUC (tableau identique d'un PA à l'autre)."""
    E_INT = [INDUSTRIE, "entrepôts > 300 m², dépôts non couverts", PROVISOIRE, CARRIERES]
    std = {
        "E2": dict(h=11.5, etages=2, surface=100, facade=8, cus=0.84, sl=(1.2, 0.45)),
        "E3": dict(h=14.5, etages=3, surface=160, facade=10, cus=0.85, sl=(1.5, 0.40)),
        "E4": dict(h=17.5, etages=4, surface=5000, facade=50, cus=0.35, cos=1.5),
    }
    out = []
    for c in codes:
        p = dict(std[c]); sl = p.pop("sl", None)
        rem = " ".join(x for x in ["RDC commercial : emprise jusqu'à 100 %." if c != "E4" else None,
                                   sans_lotissement(*sl) if sl else None,
                                   "Lotissements : 5 % du terrain en espaces libres plantés.", note] if x)
        out.append(zone(c, "E", "Tissu existant mixte", DEF_E, AUT_E, E_INT, remarque=rem, article=article, **p))
    return out


def gpsl(zone, article="zone GPSL"):
    return zone("GPSL", "PB", "Sport et loisirs de plein air",
                "Espace ouvert protégé pour le sport et les loisirs (golfs, hippodromes, plaines de jeux).",
                ["sport et loisirs", "équipements touristiques"],
                ["morcellement", "habitation", "dépôts et hangars", "industrie", CARRIERES], remarque=NON_CONSTR, article=article)
