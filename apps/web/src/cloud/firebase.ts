/**
 * Connexion Firebase (comptes + scénarios synchronisés).
 *
 * Activée seulement si la configuration web Firebase est fournie via les
 * variables VITE_FIREBASE_* (cf. .env.example et docs/comptes-firebase.md).
 * Sans elle, le site fonctionne comme avant : scénarios sur l'appareil.
 *
 * Le SDK est chargé à la demande (import dynamique) pour ne pas alourdir le
 * premier chargement de la carte.
 */
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** Vrai quand le projet Firebase est configuré pour ce déploiement. */
export const cloudEnabled = Boolean(config.apiKey && config.projectId && config.appId);

export interface Cloud {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let cloudPromise: Promise<Cloud> | null = null;

export function getCloud(): Promise<Cloud> {
  if (!cloudEnabled) return Promise.reject(new Error("Comptes non configurés"));
  cloudPromise ??= (async () => {
    const [{ initializeApp }, { getAuth }, { initializeFirestore, persistentLocalCache }] =
      await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
        import("firebase/firestore"),
      ]);
    const app = initializeApp(config);
    const auth = getAuth(app);
    auth.languageCode = "fr";
    // Cache local : les scénarios restent consultables hors connexion.
    const db = initializeFirestore(app, { localCache: persistentLocalCache() });
    return { app, auth, db };
  })();
  return cloudPromise;
}
