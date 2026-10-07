# Comptes utilisateurs (Firebase) — mise en place

Les comptes permettent de retrouver ses scénarios sur tous ses appareils.
Tant que Firebase n'est pas configuré, le site fonctionne comme avant :
les scénarios restent sur l'appareil.

Coût : gratuit (plan **Spark** de Firebase, sans carte bancaire) — jusqu'à
50 000 utilisateurs actifs par mois et 1 Go de données.

## 1. Créer le projet Firebase (≈ 5 min)

1. Aller sur <https://console.firebase.google.com> avec votre compte Google.
2. **Créer un projet** → nom : `casa-urban` → Google Analytics : **désactivé**
   (pas nécessaire).
3. Dans le projet, cliquer sur l'icône **Web** (`</>`) pour ajouter une
   application → nom : `casa-urban-web` → *ne pas* cocher Firebase Hosting.
4. Firebase affiche un bloc `const firebaseConfig = { … }` : **copier ces
   6 valeurs** (apiKey, authDomain, projectId, storageBucket,
   messagingSenderId, appId).

## 2. Activer la connexion

Menu **Build → Authentication → Commencer**, onglet **Sign-in method** :

- **E-mail/Mot de passe** → Activer → Enregistrer.
- **Google** → Activer → choisir l'e-mail d'assistance → Enregistrer.

Onglet **Settings → Domaines autorisés** : ajouter
`casa-urbain-web.vercel.app` (`localhost` y est déjà).

## 3. Créer la base de données

Menu **Build → Firestore Database → Créer une base de données** :

- Édition **Standard**, emplacement **`eur3 (Europe)`** (le plus proche du
  Maroc ; ne peut plus être changé ensuite).
- Démarrer en **mode production**.

Puis onglet **Règles** : remplacer le contenu par celui du fichier
[`firestore.rules`](../firestore.rules) du dépôt → **Publier**.
(Ces règles garantissent que chaque utilisateur ne voit que ses scénarios.)

## 4. Brancher le site

**En local (pour tester)** : copier `apps/web/.env.example` en
`apps/web/.env.local` et y coller les 6 valeurs, puis `npm run dev`.

**En production (Vercel)** : *Project → Settings → Environment Variables*,
ajouter les 6 variables `VITE_FIREBASE_…` (environnements Production et
Preview), puis redéployer.

## Données personnelles

Le site conserve l'e-mail de l'utilisateur et ses scénarios. Au Maroc, cela
relève de la loi 09-08 (CNDP) : la mention de confidentialité affichée dans
la fenêtre de connexion couvre l'essentiel ; pour supprimer un compte, le
faire depuis *Authentication → Users* et supprimer ses documents dans
*Firestore → users/{uid}*.
