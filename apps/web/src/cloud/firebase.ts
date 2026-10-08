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

let appPromise: Promise<FirebaseApp> | null = null;
let authPromise: Promise<Auth> | null = null;
let dbPromise: Promise<Firestore> | null = null;

function getApp(): Promise<FirebaseApp> {
  if (!cloudEnabled) return Promise.reject(new Error("Comptes non configurés"));
  appPromise ??= import("firebase/app").then(({ initializeApp }) => initializeApp(config));
  return appPromise;
}

/**
 * Connexion seule : chargée au démarrage pour savoir si l'utilisateur est
 * connecté. Firestore (le plus lourd) n'est chargé qu'à l'ouverture du
 * calculateur — les visiteurs qui ne regardent que la carte ne le paient pas.
 */
export function getAuthClient(): Promise<Auth> {
  authPromise ??= Promise.all([getApp(), import("firebase/auth")]).then(([app, { getAuth }]) => {
    const auth = getAuth(app);
    auth.languageCode = "fr";
    return auth;
  });
  return authPromise;
}

export function getDb(): Promise<Firestore> {
  dbPromise ??= Promise.all([getApp(), import("firebase/firestore")]).then(
    ([app, { initializeFirestore, persistentLocalCache, persistentMultipleTabManager }]) =>
      initializeFirestore(app, {
        // Cache local : les scénarios restent consultables hors connexion. Mode
        // multi-onglets : le site peut être ouvert dans plusieurs onglets à la fois.
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        // Champs facultatifs absents (ex. façade inconnue d'une zone AUC) :
        // Firestore refuse `undefined` par défaut et l'enregistrement échouait.
        ignoreUndefinedProperties: true,
      }),
  );
  return dbPromise;
}
