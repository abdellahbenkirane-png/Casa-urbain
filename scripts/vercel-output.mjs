// Build Output API v3 — https://vercel.com/docs/build-output-api/v3
// Vite a produit dist/ à la racine du repo. On copie son contenu dans
// .vercel/output/static/ et on écrit la config v3 + le rewrite SPA.
// Cette structure est reconnue de manière fiable par Vercel, indépendamment
// des réglages "Output Directory" du dashboard.

import { cp, mkdir, writeFile, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const distDir = resolve(root, "dist");
const outDir = resolve(root, ".vercel/output");
const staticDir = resolve(outDir, "static");

await stat(distDir).catch(() => {
  console.error(`[vercel-output] dist/ introuvable à ${distDir}`);
  process.exit(1);
});

await rm(outDir, { recursive: true, force: true });
await mkdir(staticDir, { recursive: true });
await cp(distDir, staticDir, { recursive: true });

const config = {
  version: 3,
  routes: [
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/index.html" },
  ],
};
await writeFile(resolve(outDir, "config.json"), JSON.stringify(config, null, 2));

console.log(`[vercel-output] OK — static copié dans ${staticDir}`);
