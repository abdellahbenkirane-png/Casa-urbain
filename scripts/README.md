# Scripts

## `fetch-overpass.mjs` — extraction OSM d'Aïn Chock

Récupère depuis OpenStreetMap (via Nominatim + Overpass) :

- Le **périmètre administratif** d'Aïn Chock → `data/ainchock/perimetre.geojson`
- Les **bâtiments** dans ce périmètre → `data/ainchock/buildings.geojson`

Les fichiers sont écrits **en double** :

- `data/ainchock/` — source de vérité versionnée dans le repo
- `apps/web/public/data/ainchock/` — copie servie en statique par Vite
  (et donc accessible à `fetch('/data/ainchock/...')` à l'exécution)

### Lancement

```bash
node scripts/fetch-overpass.mjs
```

Aucune dépendance npm. Utilise le `fetch` natif de Node 18+.

### Sortie attendue

```
Recherche de la relation OSM d'Aïn Chock via Nominatim…
  trouvé : relation 2801442 — Arrondissement d'Aïn Chock…
Récupération du périmètre…
Périmètre écrit (1 anneau(x))
Bbox : (33.4933, -7.6729) — (33.5595, -7.5661)
Récupération des bâtiments…
Bâtiments écrits : ~11 500
```

Taille typique du `buildings.geojson` : 3-4 Mo (raison pour laquelle il est servi
en static plutôt qu'inliné dans le bundle JS).

### Quand le ré-exécuter

- Pour rafraîchir les bâtiments suite à de nouvelles contributions OSM
- Avant de capturer un état figé pour publication / démo

## Planche PAU d'Aïn Chock

`apps/web/public/data/ainchock/pau-planche.jpg` — image rastérisée de la
planche d'ensemble du PAU (extraite du PDF officiel envoyé par l'Agence Urbaine).

L'app la propose en **calque optionnel** sous une coche en haut à droite de
la carte, avec un slider d'opacité.

### Géoréférencement actuel : approximatif

Le PDF source ne contient aucune métadonnée géographique. La planche est
donc placée à 4 coins fixes encadrant grossièrement Aïn Chock. Le format
de la planche (portrait, ratio W/H ≈ 0,77) ne correspond pas exactement au
bbox du périmètre OSM (paysage, ratio ≈ 1,35), donc l'image est étirée
verticalement. **Bon pour visualiser les zones, pas assez précis pour
calculer une parcelle**.

### Améliorer le géoréférencement (optionnel)

Pour aligner précisément la planche sur les vraies coordonnées :

1. Ouvrir `apps/web/public/data/ainchock/pau-planche.jpg` dans **QGIS**
   (Raster → Géoréférencer)
2. Identifier 4-6 points de contrôle visibles à la fois sur la planche et
   sur le fond OSM (carrefours, ronds-points caractéristiques)
3. Saisir leurs coordonnées WGS 84
4. Lancer la transformation polynomiale d'ordre 1 ou 2
5. Exporter le géo-tiff
6. Récupérer les 4 coins en lat/lng et remplacer les valeurs `W, E, S, N`
   dans `apps/web/src/map/MapView.tsx` (calque `planche`)

### Régénérer depuis le PDF

```bash
python3 -c "
import fitz
doc = fitz.open('chemin/vers/PLANCHE-D-ENSEMBLE.pdf')
page = doc[0]
zoom = 3000 / page.rect.width
mat = fitz.Matrix(zoom, zoom)
pix = page.get_pixmap(matrix=mat, alpha=False)
pix.save('apps/web/public/data/ainchock/pau-planche.jpg', jpg_quality=80)
"
```

## Remplacer par les vraies données AUC

Quand l'Agence Urbaine de Casablanca livrera le vrai parcellaire et le zonage du
PAU (cf. [docs/courrier-auc.md](../docs/courrier-auc.md)) :

1. Convertir les Shapefile en GeoJSON (QGIS → *Save as GeoJSON*, EPSG:4326)
2. Remplacer `data/ainchock/parcelles.geojson` par le parcellaire officiel
3. Ajouter `data/ainchock/zones-pau.geojson` avec un attribut `zone` aligné sur
   les codes du règlement (SD1, SD2, ZH, ZE, ZI…)
4. Mettre à jour [data/reglement/pau-zones.json](../data/reglement/pau-zones.json)
   avec les vraies valeurs COS/CUS/hauteurs par zone
5. Adapter `apps/web/src/map/MapView.tsx` pour ajouter un calque zonage par-dessus
   les bâtiments et sous les parcelles
