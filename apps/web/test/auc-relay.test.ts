import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../api/auc.js";

function fakeRes() {
  const r = { statusCode: 0, headers: {} as Record<string, string>, body: "" as unknown };
  const res = {
    setHeader: (k: string, v: string) => void (r.headers[k.toLowerCase()] = v),
    status(code: number) {
      r.statusCode = code;
      return res;
    },
    send(b: string) {
      r.body = b;
    },
    json(o: unknown) {
      r.body = o;
    },
  };
  return { r, res };
}

const upstream = (body: string, status = 200) =>
  vi.stubGlobal(
    "fetch",
    // 204 : une Response « sans contenu » ne peut pas avoir de corps.
    vi.fn(async () => new Response(status === 204 ? null : body, { status })),
  );

afterEach(() => vi.unstubAllGlobals());

describe("relais /api/auc", () => {
  it("relaie une réponse valable et la met en cache 1 jour au CDN", async () => {
    upstream(JSON.stringify({ features: [] }));
    const { r, res } = fakeRes();
    await handler({ query: { layer: "Layer-579747", f: "json" } }, res);
    expect(r.statusCode).toBe(200);
    expect(r.headers["cache-control"]).toContain("s-maxage=86400");
  });

  it("transmet les paramètres à AUC (sauf « layer », qui va dans le chemin)", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ features: [] })));
    vi.stubGlobal("fetch", fetchMock);
    await handler({ query: { layer: "Layer-579747", where: "1=1" } }, fakeRes().res);
    const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("/features/Layer-579747/all/1/query?");
    expect(url).toContain("where=1%3D1");
    expect(url).not.toContain("layer=");
  });

  it.each([
    ["erreur ArcGIS en HTTP 200", JSON.stringify({ error: { code: 500 } }), 200],
    ["réponse vide (204)", "", 204],
    ["erreur HTTP amont", "oops", 500],
    ["corps non JSON", "<html>", 200],
  ])("%s → 502 sans mise en cache", async (_label, body, status) => {
    upstream(body, status);
    const { r, res } = fakeRes();
    await handler({ query: {} }, res);
    expect(r.statusCode).toBe(502);
    expect(r.headers["cache-control"]).toBe("no-store");
  });

  it("serveur AUC injoignable → 502", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNRESET"); }));
    const { r, res } = fakeRes();
    await handler({ query: {} }, res);
    expect(r.statusCode).toBe(502);
    expect(r.headers["cache-control"]).toBe("no-store");
  });
});
