import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Casa Urban — Simulateur d'investissement",
        short_name: "Casa Urban",
        description:
          "Plan d'Aménagement Unifié + simulateur de pro forma promoteur sur Casablanca",
        theme_color: "#0e1116",
        background_color: "#0e1116",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // Stratégie : cache les tuiles et les assets statiques agressivement,
        // mais bypass le cache pour l'API AUC (donnée live) et l'API Vercel.
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.host === "a.basemaps.cartocdn.com" ||
              url.host === "b.basemaps.cartocdn.com" ||
              url.host === "c.basemaps.cartocdn.com" ||
              url.host === "server.arcgisonline.com",
            handler: "CacheFirst",
            options: {
              cacheName: "tile-cache",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
          {
            urlPattern: /\/data\/.*\.(geojson|jpg|jpeg|png)$/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "data-cache" },
          },
          {
            urlPattern: /\/api\/auc/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunks : isole les grosses dépendances pour qu'elles
        // soient cachées indépendamment du code app entre 2 déploiements.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("maplibre-gl")) return "maplibre";
            if (id.includes("react-dom")) return "react";
            if (id.includes("/react/")) return "react";
            if (id.includes("zustand") || id.includes("idb-keyval")) return "state";
            if (id.includes("zod")) return "zod";
            if (id.includes("exceljs")) return "exceljs";
          }
        },
      },
    },
  },
});
