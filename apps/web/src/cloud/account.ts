import { create } from "zustand";
import { cloudEnabled, getCloud } from "./firebase";

export interface AccountUser {
  uid: string;
  email: string | null;
  name: string | null;
}

interface AccountState {
  /** false tant que Firebase n'a pas dit si une session existe déjà. */
  ready: boolean;
  user: AccountUser | null;
  init: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

let started = false;

export const useAccount = create<AccountState>((set) => ({
  ready: !cloudEnabled,
  user: null,

  init() {
    if (!cloudEnabled || started) return;
    started = true;
    void (async () => {
      const { auth } = await getCloud();
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

  async signInWithGoogle() {
    const { auth } = await getCloud();
    const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    await signInWithPopup(auth, new GoogleAuthProvider());
  },

  async signInWithEmail(email, password) {
    const { auth } = await getCloud();
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    await signInWithEmailAndPassword(auth, email.trim(), password);
  },

  async signUpWithEmail(email, password) {
    const { auth } = await getCloud();
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  },

  async resetPassword(email) {
    const { auth } = await getCloud();
    const { sendPasswordResetEmail } = await import("firebase/auth");
    await sendPasswordResetEmail(auth, email.trim());
  },

  async signOut() {
    const { auth } = await getCloud();
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  },
}));

/** Messages d'erreur Firebase traduits pour l'utilisateur. */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const messages: Record<string, string> = {
    "auth/invalid-email": "Adresse e-mail invalide.",
    "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
    "auth/wrong-password": "E-mail ou mot de passe incorrect.",
    "auth/user-not-found": "Aucun compte avec cet e-mail.",
    "auth/email-already-in-use": "Un compte existe déjà avec cet e-mail. Connectez-vous.",
    "auth/weak-password": "Mot de passe trop court (6 caractères minimum).",
    "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
    "auth/popup-closed-by-user": "Fenêtre Google fermée avant la fin de la connexion.",
    "auth/popup-blocked": "Fenêtre bloquée par le navigateur : autorisez les pop-ups pour ce site.",
    "auth/network-request-failed": "Pas de connexion internet.",
    "auth/unauthorized-domain": "Ce domaine n'est pas autorisé dans la configuration Firebase.",
  };
  if (messages[code]) return messages[code]!;
  // Erreurs de configuration du projet Firebase (cf. docs/comptes-firebase.md).
  if (code.startsWith("auth/api-key-not-valid") || code === "auth/invalid-api-key")
    return "Configuration Firebase invalide (clé API). Vérifiez les variables VITE_FIREBASE_….";
  if (code === "auth/operation-not-allowed" || code === "auth/configuration-not-found")
    return "Cette méthode de connexion n'est pas activée dans la console Firebase.";
  console.warn("[account] erreur non traduite", code, e);
  return "Une erreur est survenue. Réessayez.";
}

/** Ouverture de la fenêtre de connexion, depuis n'importe quel composant. */
export const useAuthModal = create<{ open: boolean; show: () => void; hide: () => void }>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));
