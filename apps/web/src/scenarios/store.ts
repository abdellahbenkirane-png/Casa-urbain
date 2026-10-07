import { create } from "zustand";
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from "idb-keyval";
import type { SimulationInput } from "@casa/core";
import { useAccount } from "../cloud/account";
import { cloudDelete, cloudImport, cloudList, cloudSave } from "../cloud/scenarios";

const KEY_PREFIX = "scenario:";

export interface StoredScenario {
  id: string;
  parcelleId: string;
  createdAt: number;
  updatedAt: number;
  input: SimulationInput;
}

const k = (id: string) => `${KEY_PREFIX}${id}`;
const newId = () => Math.random().toString(36).slice(2, 10);

// Connecté → scénarios dans le compte (Firestore) ; sinon → cet appareil (IndexedDB).
const uid = () => useAccount.getState().user?.uid ?? null;

export async function listScenariosForParcelle(parcelleId: string): Promise<StoredScenario[]> {
  const u = uid();
  if (u) return cloudList(u, parcelleId);
  return listLocal((s) => s.parcelleId === parcelleId);
}

export async function saveScenario(s: StoredScenario): Promise<void> {
  const u = uid();
  const item = { ...s, updatedAt: Date.now() };
  if (u) await cloudSave(u, item);
  else await idbSet(k(s.id), item);
}

export async function deleteScenario(id: string): Promise<void> {
  const u = uid();
  if (u) await cloudDelete(u, id);
  else await idbDel(k(id));
}

/** Scénarios restés sur cet appareil (créés avant la connexion). */
export async function listLocal(
  filter: (s: StoredScenario) => boolean = () => true,
): Promise<StoredScenario[]> {
  const ks = await idbKeys();
  const items: StoredScenario[] = [];
  for (const key of ks) {
    if (typeof key !== "string" || !key.startsWith(KEY_PREFIX)) continue;
    const item = (await idbGet(key)) as StoredScenario | undefined;
    if (item && filter(item)) items.push(item);
  }
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Copie les scénarios de l'appareil dans le compte, puis les retire de l'appareil. */
export async function importLocalIntoAccount(): Promise<number> {
  const u = uid();
  if (!u) return 0;
  const items = await listLocal();
  if (items.length === 0) return 0;
  await cloudImport(u, items);
  await Promise.all(items.map((s) => idbDel(k(s.id))));
  return items.length;
}

interface SimState {
  parcelleId: string | null;
  scenarios: StoredScenario[];
  activeId: string | null;
  loadForParcelle: (parcelleId: string) => Promise<void>;
  setActive: (id: string) => void;
  upsert: (input: SimulationInput, id?: string) => Promise<string>;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<string | null>;
  reset: () => void;
}

export const useScenarioStore = create<SimState>((set, get) => ({
  parcelleId: null,
  scenarios: [],
  activeId: null,

  async loadForParcelle(parcelleId) {
    let scenarios: StoredScenario[] = [];
    try {
      scenarios = await listScenariosForParcelle(parcelleId);
    } catch (e) {
      // Compte injoignable (hors ligne, règles…) : on n'empêche pas de simuler.
      console.warn("[scenarios] chargement impossible", e);
    }
    set({
      parcelleId,
      scenarios,
      activeId: scenarios[0]?.id ?? null,
    });
  },

  setActive(id) {
    set({ activeId: id });
  },

  async upsert(input, id) {
    const { parcelleId, scenarios } = get();
    if (!parcelleId) throw new Error("Aucune parcelle active");
    const now = Date.now();
    const existing = id ? scenarios.find((s) => s.id === id) : undefined;
    const stored: StoredScenario = existing
      ? { ...existing, input, updatedAt: now }
      : {
          id: newId(),
          parcelleId,
          createdAt: now,
          updatedAt: now,
          input,
        };
    await saveScenario(stored);
    const updated = existing
      ? scenarios.map((s) => (s.id === stored.id ? stored : s))
      : [stored, ...scenarios];
    set({ scenarios: updated, activeId: stored.id });
    return stored.id;
  },

  async remove(id) {
    await deleteScenario(id);
    const { scenarios, activeId } = get();
    const filtered = scenarios.filter((s) => s.id !== id);
    set({
      scenarios: filtered,
      activeId: activeId === id ? (filtered[0]?.id ?? null) : activeId,
    });
  },

  async duplicate(id) {
    const { scenarios } = get();
    const src = scenarios.find((s) => s.id === id);
    if (!src) return null;
    return get().upsert(
      { ...src.input, nom: `${src.input.nom} (copie)` },
      undefined,
    );
  },

  reset() {
    set({ parcelleId: null, scenarios: [], activeId: null });
  },
}));
