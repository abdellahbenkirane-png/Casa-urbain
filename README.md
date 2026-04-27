# Casa Urban — Simulateur d'investissement immobilier

Plateforme cartographique pour explorer le Plan d'Aménagement Unifié (PAU) de Casablanca et simuler la rentabilité d'opérations immobilières à partir d'une parcelle.

## Périmètre MVP

- Quartier : **Aïn Chock**
- Carte interactive (MapLibre) avec calque parcelles + zonage PAU
- Fiches règlement (SD, R+x, ZH…) cliquables
- Simulateur de pro forma promoteur (CA, charges, EBIT, IS, marge, ROE)
- Comparateur de scénarios sur une même parcelle

## Structure

```
casa-urban/
├── apps/
│   └── web/             Vite + React + MapLibre (front)
├── packages/
│   └── core/            Moteur de calcul TypeScript (formules pro forma)
└── data/
    ├── ainchock/        GeoJSON parcelles + zones PAU + benchmarks prix
    └── reglement/       Définitions de zonage du PAU
```

## Démarrage

```bash
npm install
npm test          # tests du moteur de calcul
npm run dev       # lance l'app web sur http://localhost:5173
```
