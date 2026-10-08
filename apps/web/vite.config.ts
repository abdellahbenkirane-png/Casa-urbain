import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import type { Plugin } from "vite";

/**
 * En dev, /api/auc n'existe pas (c'est une fonction serverless Vercel) : sans
 * ce relais le zonage AUC ne s'affiche pas en local. On réutilise le même
 * handler (api/auc.js) via un petit adaptateur req/res façon Vercel.
 */
function aucDevProxy(): Plugin {
  return {
    name: "auc-dev-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/auc", async (req, res) => {
        const { default: handler } = await import("./api/auc.js");
        const url = new URL(req.url ?? "", "http://localhost");
        const query: Record<string, string> = Object.fromEntries(url.searchParams);
        const vres = {
          setHeader: (k: string, v: string) => res.setHeader(k, v),
          status(code: number) {
            res.statusCode = code;
            return vres;
          },
          send(body: string) {
            res.end(body);
          },
          json(obj: unknown) {
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify(obj));
          },
        };
        await handler({ query }, vres);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    aucDevProxy(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "Casa Urban — Simulateur d'investissement",
        short_name: "Casa Urban",
        description:
          "Plan d'Aménagement Unifié + simulateur de pro forma promoteur sur Casablanca",
        theme_color: "#0f766e",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // Stratégie : cache les tuiles et les assets statiques agressivement ;
        // le zonage AUC en stale-while-revalidate.
        navigateFallback: "/index.html",
        // Firebase (~900 kB) n'est chargé que si l'utilisateur se connecte :
        // on ne le pré-télécharge pas pour tout le monde.
        globIgnores: ["**/firebase-*.js"],
        // Nouvelle version active immédiatement (sans attendre la fermeture
        // de tous les onglets) et purge des anciens précaches.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.host === "server.arcgisonline.com",
            handler: "CacheFirst",
            options: {
              // v2 : l'ancien cache contenait des tuiles CARTO « API KEY REQUIRED ».
              cacheName: "tile-cache-v2",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: /\/data\/.*\.(geojson|jpg|jpeg|png)$/,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "data-cache" },
          },
          {
            // Carrés de zonage : affichage instantané depuis le cache, puis
            // mise à jour en arrière-plan (le zonage change rarement).
            urlPattern: /\/api\/auc/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "auc-zonage-v1",
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [200] },
            },
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
            if (id.includes("firebase") || id.includes("@firebase")) return "firebase";
          }
        },
      },
    },
  },
});
