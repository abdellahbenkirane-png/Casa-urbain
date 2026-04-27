/// <reference types="vite/client" />

declare module "*.geojson?url" {
  const src: string;
  export default src;
}

declare module "*.geojson?raw" {
  const value: string;
  export default value;
}

declare module "*.geojson" {
  const value: GeoJSON.FeatureCollection;
  export default value;
}
