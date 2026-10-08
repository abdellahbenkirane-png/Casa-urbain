import { create } from "zustand";
import { cloudEnabled, getAuthClient } from "./firebase";

export interface AccountUser {
  uid: string;
  email: string | null;
  name: string | null;
}

interface AccountState {
  /** false tant que Firebase n'a pas dit si une session existe déjà. */
  ready: boolean;
  user: AccountUser | null;
  /** Connexion Google en cours (fenêtre ouverte). */
  busy: boolean;
  /** Dernière erreur de connexion, déjà traduite. */
  error: string | null;
  init: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

let started = false;

export const useAccount = create<AccountState>((set) => ({
  ready: !cloudEnabled,
  user: null,
  busy: false,
  error: null,

  init() {
    if (!cloudEnabled || started) return;
    started = true;
    void (async () => {
      const auth = await getAuthClient();
      const { onAuthStateChanged } = await import("firebase/auth");
      onAuthStateChanged(auth, (u) => {
        set({
          ready: true,
          user: u ? { uid: u.uid, email: u.email, name: u.displayName } : null,
        });
      });
    })().catch((e) => {
      console.warn("[account] Firebase indisponible", e);
      set({ ready: true });
    });
  },

  // Connexion uniquement via Google : un clic, pas de mot de passe à gérer.
  async signIn() {
    set({ busy: true, error: null });
    try {
      const auth = await getAuthClient();
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (e) {
      const msg = authErrorMessage(e);
      if (msg) set({ error: msg });
    } finally {
      set({ busy: false });
    }
  },

  async signOut() {
    const auth = await getAuthClient();
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  },

  clearError: () => set({ error: null }),
}));

/** Message d'erreur affichable, ou null si l'utilisateur a simplement annulé. */
function authErrorMessage(e: unknown): string | null {
  const code = (e as { code?: string })?.code ?? "";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return null;
  const messages: Record<string, string> = {
    "auth/popup-blocked": "Fenêtre bloquée par le navigateur : autorisez les pop-ups pour ce site.",
    "auth/network-request-failed": "Pas de connexion internet.",
    "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
    "auth/unauthorized-domain": "Ce domaine n'est pas autorisé dans la configuration Firebase.",
    "auth/operation-not-allowed": "La connexion Google n'est pas activée dans la console Firebase.",
    "auth/configuration-not-found": "La connexion Google n'est pas activée dans la console Firebase.",
  };
  if (messages[code]) return messages[code]!;
  if (code.startsWith("auth/api-key-not-valid") || code === "auth/invalid-api-key")
    return "Configuration Firebase invalide (clé API). Vérifiez les variables VITE_FIREBASE_….";
  console.warn("[account] erreur non traduite", code, e);
  return "La connexion a échoué. Réessayez.";
}
