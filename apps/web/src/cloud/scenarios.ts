/**
 * Scénarios stockés dans le compte : users/{uid}/scenarios/{id} (Firestore).
 * Les règles de sécurité (firestore.rules) n'autorisent chaque utilisateur
 * qu'à ses propres documents.
 */
import type { StoredScenario } from "../scenarios/store";
import { getCloud } from "./firebase";

const col = async (uid: string) => {
  const { db } = await getCloud();
  const { collection } = await import("firebase/firestore");
  return collection(db, "users", uid, "scenarios");
};

export async function cloudList(uid: string, parcelleId: string): Promise<StoredScenario[]> {
  const { getDocs, query, where } = await import("firebase/firestore");
  const snap = await getDocs(query(await col(uid), where("parcelleId", "==", parcelleId)));
  return snap.docs
    .map((d) => d.data() as StoredScenario)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Firestore applique l'écriture tout de suite dans son cache local, mais la
 * promesse n'aboutit qu'après confirmation du serveur — jamais hors ligne.
 * Au-delà de quelques secondes, on considère l'écriture acquise : elle sera
 * synchronisée au retour du réseau. Une vraie erreur (droits…) reste remontée.
 */
const PENDING_SYNC_MS = 4000;
const settleOrPending = (p: Promise<void>) =>
  Promise.race([p, new Promise<void>((resolve) => setTimeout(resolve, PENDING_SYNC_MS))]);

/** Copie sans les champs `undefined` (refusés par Firestore). */
const clean = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export async function cloudSave(uid: string, s: StoredScenario): Promise<void> {
  const { doc, setDoc } = await import("firebase/firestore");
  await settleOrPending(setDoc(doc(await col(uid), s.id), clean(s)));
}

export async function cloudDelete(uid: string, id: string): Promise<void> {
  const { doc, deleteDoc } = await import("firebase/firestore");
  await settleOrPending(deleteDoc(doc(await col(uid), id)));
}

/** Copie des scénarios dans le compte en une seule écriture groupée. */
export async function cloudImport(uid: string, items: StoredScenario[]): Promise<void> {
  const { db } = await getCloud();
  const { doc, writeBatch } = await import("firebase/firestore");
  const c = await col(uid);
  // Firestore limite un lot à 500 écritures.
  for (let i = 0; i < items.length; i += 450) {
    const batch = writeBatch(db);
    for (const s of items.slice(i, i + 450)) batch.set(doc(c, s.id), clean(s));
    await batch.commit();
  }
}
