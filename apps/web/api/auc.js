// Proxy CORS-safe vers le service ArcGIS REST de l'Agence Urbaine de Casablanca
// (https://e-auc.org/karazal). Le service ne renvoie pas systématiquement les
// bons en-têtes CORS pour les origines tierces, donc on relaie les appels
// depuis cette fonction serverless Vercel — l'app web parle à /api/auc et c'est
// la fonction qui fait l'aller-retour AUC.
//
// Usage côté client :
//   /api/auc?layer=Layer-579748&where=1=1&outFields=id,zone,...&geometry=...
// Tous les paramètres sauf `layer` sont relayés tels quels au service AUC.

const AUC_BASE =
  "https://e-auc.org/karazal/kgis/rest/featuresService/features";

export default async function handler(req, res) {
  const { layer, ...rest } = req.query;
  const layerId = typeof layer === "string" && layer ? layer : "Layer-579748";

  // Reconstruction de la query string. Vercel parse certains params en tableaux
  // si la clé apparaît plusieurs fois — on aplatit avant de réémettre.
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(rest)) {
    if (Array.isArray(v)) v.forEach((vv) => sp.append(k, vv));
    else if (typeof v === "string") sp.set(k, v);
  }
  if (!sp.has("f")) sp.set("f", "json");

  const target = `${AUC_BASE}/${encodeURIComponent(layerId)}/all/1/query?${sp.toString()}`;

  try {
    const upstream = await fetch(target, {
      headers: { Accept: "application/json", "User-Agent": "casa-urban-proxy/1.0" },
    });
    const body = await upstream.text();

    res.setHeader("content-type", "application/json; charset=utf-8");
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("cache-control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.status(upstream.status).send(body);
  } catch (e) {
    res.status(502).json({
      error: "Upstream AUC fetch failed",
      message: String(e?.message ?? e),
    });
  }
}
