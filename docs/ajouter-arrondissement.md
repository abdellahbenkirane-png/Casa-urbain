# Ajouter un autre arrondissement de Casablanca

L'app est désormais cadrée sur **tout Casablanca** (zoom 12 par défaut).
Le calque **Zonage AUC** servi par l'API officielle (`Layer-579747`) couvre
déjà l'ensemble des préfectures d'arrondissement — clic sur n'importe
quelle parcelle de la ville → on récupère secteur + préfecture + zone.

Le règlement détaillé (paramètres COS, hauteurs, surfaces min…) est en
revanche calé sur **Aïn Chock 2025**. Pour étendre à un autre arrondissement
(Anfa, Hay Hassani, Ben M'Sick, Sidi Bernoussi, Aïn Sebaâ — Hay Mohammadi,
Mers Sultan, Moulay Rachid, Casa-Anfa) :

## 1. Récupérer la documentation officielle

Sur https://www.auc.ma/e-services-2/e-documents/ — choisis le PA de
l'arrondissement cible. Tu y trouveras :

- **Rapport justificatif** (informatif)
- **Règlement Général** (RG-XX.pdf)
- Une **fiche par zone** (ZONE-A-X.pdf, ZONE-B-X.pdf, …)
- **Patrimoine bâti** + **Équipements**
- **Planche d'ensemble** (carte raster)

## 2. Rendre les fiches en JPG

Réutilise le snippet PyMuPDF (cf. [scripts/README.md](../scripts/README.md))
pour générer les images :

```bash
mkdir -p apps/web/public/data/<slug>/reglement
python3 -c "
import fitz, os
src = 'CHEMIN/VERS/PA/RG-XX.pdf'
dst = 'apps/web/public/data/<slug>/reglement/rg-p{:02d}.jpg'
doc = fitz.open(src)
for i in range(doc.page_count):
    page = doc[i]
    zoom = 1500 / page.rect.width
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    pix.save(dst.format(i + 1), jpg_quality=78)
"
```

Répète pour chaque ZONE-*.pdf, PATRIMOINE, EQUIPEMENTS.

## 3. Extraire les paramètres dans `pau-zones.json`

Lis chaque fiche de zone (le `pdf-viewer` MCP fonctionne bien, ou Apple
Aperçu) et reporte dans
[`data/reglement/pau-zones.json`](../data/reglement/pau-zones.json) les
sous-secteurs avec leurs paramètres :

```jsonc
{
  "zones": {
    "B5":   { "code": "B5", "famille": "B", "nom": "Zone B5 — collectif R+5", … },
    "A6":   { … },
    // ...
  }
}
```

Si un sous-secteur a des paramètres **différents** entre arrondissements,
deux options :

- **a)** Renommer la clé pour préfixer l'arrondissement (ex. `ANFA-B5`,
  `AIN-CHOCK-B5`) et adapter `MapView.tsx` pour produire la clé en
  préfixant la préfecture détectée.
- **b)** Garder une seule entrée et accepter que les valeurs sont une
  approximation moyenne (acceptable pour un MVP investisseur).

## 4. Planche d'ensemble (raster optionnel)

Si tu veux projeter la planche officielle de l'arrondissement par-dessus
la carte :

```python
python3 -c "
import fitz
doc = fitz.open('CHEMIN/VERS/PLANCHE-D-ENSEMBLE.pdf')
page = doc[0]
zoom = 3000 / page.rect.width
pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
pix.save('apps/web/public/data/<slug>/pau-planche.jpg', jpg_quality=80)
"
```

Et adapte les coordonnées de coins dans
[`MapView.tsx`](../apps/web/src/map/MapView.tsx) (variable `DEFAULT_BBOX`),
ou utilise l'outil de calage manuel (coche **Planche PAU** → bouton
**Caler la planche**).

## 5. Permettre le sélecteur d'arrondissement (à venir)

Pour l'instant l'app charge un seul jeu de règlement (Aïn Chock).
L'évolution propre serait :

1. Détecter la préfecture du clic AUC (`a.prefecture` est déjà extrait
   dans `MapView.tsx`)
2. Mapper préfecture → fichier règlement à charger
3. Lazy-charger le bon `pau-zones.json` au runtime
4. Mettre à jour `DocumentLibrary` pour pointer vers les bons PDFs

Le crochet est déjà posé : `parcelle.prefecture` est passé au panneau,
et un bandeau d'avertissement s'affiche déjà si la préfecture n'est pas
documentée. Il ne reste qu'à charger des règlements supplémentaires.
