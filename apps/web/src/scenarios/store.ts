import { create } from "zustand";
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from "idb-keyval";
import type { SimulationInput } from "@casa/core";

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

export async function listScenariosForParcelle(parcelleId: string): Promise<StoredScenario[]> {
  const ks = await idbKeys();
  const items: StoredScenario[] = [];
  for (const key of ks) {
    if (typeof key !== "string" || !key.startsWith(KEY_PREFIX)) continue;
    const item = (await idbGet(key)) as StoredScenario | undefined;
    if (item && item.parcelleId === parcelleId) items.push(item);
  }
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveScenario(s: StoredScenario): Promise<void> {
  await idbSet(k(s.id), { ...s, updatedAt: Date.now() });
}

export async function deleteScenario(id: string): Promise<void> {
  await idbDel(k(id));
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
    const scenarios = await listScenariosForParcelle(parcelleId);
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
