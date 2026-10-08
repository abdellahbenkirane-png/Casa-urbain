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

// Après un déploiement, une page restée ouverte peut réclamer un ancien
// fichier JS qui n'existe plus (ex. au clic sur « Se connecter ») : on
// recharge une fois pour récupérer la nouvelle version, plutôt que d'échouer.
window.addEventListener("vite:preloadError", (e) => {
  const KEY = "casa-reload-after-deploy";
  if (sessionStorage.getItem(KEY)) return; // déjà tenté : on laisse l'erreur remonter
  sessionStorage.setItem(KEY, "1");
  e.preventDefault();
  window.location.reload();
});
window.addEventListener("load", () => {
  // Chargement réussi : on réarme pour le prochain déploiement.
  setTimeout(() => sessionStorage.removeItem("casa-reload-after-deploy"), 10_000);
});
