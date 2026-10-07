import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "maplibre-gl/dist/maplibre-gl.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Recharge automatiquement quand une nouvelle version du service worker prend
// la main, pour que les visiteurs voient le dernier déploiement sans F5.
if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
}

// Ancien cache de tuiles : contenait des tuiles CARTO « API KEY REQUIRED ».
if ("caches" in window) caches.delete("tile-cache").catch(() => {});
