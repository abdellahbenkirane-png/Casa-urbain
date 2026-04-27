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

### Remplacer par les vraies données AUC

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
