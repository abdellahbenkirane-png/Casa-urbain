# Demande de données — Agence Urbaine de Casablanca

Modèle de courrier à adresser à l'Agence Urbaine de Casablanca (AUC) pour solliciter
les données du Plan d'Aménagement Unifié (PAU) sur Aïn Chock, indispensables pour
faire passer le simulateur Casa Urban du stade MVP (données OSM) au stade
opérationnel (données officielles).

---

## Coordonnées de l'AUC

- **Adresse** : Agence Urbaine de Casablanca, 9, rue Khaled Beneloualid, Aïn Sebaâ, Casablanca
- **Site** : https://www.auc.ma
- **Email général** : contact@auc.ma
- **Téléphone** : +212 5 22 66 80 80

> **Astuce** : envoyer en double, par mail ET par courrier recommandé avec accusé
> de réception. Demander un récépissé. Délai de réponse habituel : 2 à 6 semaines.

---

## Modèle d'email (à copier-coller)

**Objet :** Demande de données SIG du Plan d'Aménagement Unifié — secteur Aïn Chock

Madame, Monsieur,

Dans le cadre du développement d'un outil cartographique d'aide à la décision pour
les investisseurs immobiliers — actuellement en phase pilote sur l'arrondissement
d'Aïn Chock —, je me permets de solliciter de votre Agence l'accès aux données du
Plan d'Aménagement Unifié de Casablanca, périmètre Aïn Chock.

Les éléments suivants me seraient particulièrement utiles, sous format SIG (shapefile,
GeoPackage ou GeoJSON, en projection Lambert Maroc Conforme — EPSG:26191 — ou en
WGS 84 — EPSG:4326) :

1. **Couche parcellaire** d'Aïn Chock (parcelles cadastrales avec identifiants et,
   si possible, surfaces).
2. **Couche zonage** du PAU (polygones avec attribut « zone » : SD, R+x, ZH, ZE, ZI…).
3. **Règlement écrit** du PAU, par zone homogène (PDF officiel ou tableau structuré
   précisant pour chaque zone : COS, CUS, hauteur maximale, retraits, emprise au sol,
   usages autorisés et interdits, gabarit).
4. **Périmètre administratif** détaillé d'Aïn Chock et de ses sous-secteurs.
5. **Servitudes et contraintes particulières** identifiées sur le périmètre
   (alignements, plans de prévention, zones non aedificandi, monuments classés…).
6. **Plans des équipements publics programmés** sur la zone, le cas échéant.

L'outil — non commercial à ce stade — vise à donner aux investisseurs une vision
claire des règles d'urbanisme applicables à une parcelle et à simuler la rentabilité
d'une opération immobilière à partir de ces règles. Les données mises à disposition
seront utilisées exclusivement à des fins d'affichage cartographique et de calcul
d'indicateurs financiers, avec mention explicite de l'AUC comme source.

Je suis à votre entière disposition pour vous présenter le projet en détail, signer
toute convention d'usage que vous jugeriez nécessaire, et adapter l'outil pour qu'il
soit utile à vos propres services le cas échéant.

Je vous remercie par avance de l'attention que vous porterez à cette demande et reste
à votre disposition pour tout complément.

Bien cordialement,

**Abdellah Benkirane**
Email : abdellah.benkirane@gmail.com
Site : https://casa-urbain-web.vercel.app

---

## Variante courrier papier (en-tête + signature)

Reprendre le corps ci-dessus et l'imprimer sous en-tête personnel ou de société, avec :

- Lieu et date en haut à droite
- Destinataire complet à gauche : *Monsieur le Directeur, Agence Urbaine de Casablanca, 9, rue Khaled Beneloualid, Aïn Sebaâ, Casablanca*
- Signature manuscrite en bas

Joindre, en pièces jointes (mail) ou en annexes (courrier) :

1. Une présentation d'1 à 2 pages du projet (capture d'écran de l'app, périmètre d'usage, indicateurs calculés).
2. Une attestation d'usage non commercial à ce stade (texte simple).
3. Un engagement de citation systématique de l'AUC comme source dans toute publication.

---

## Si la réponse est négative ou tardive

Plan B : déposer une demande de communication de documents administratifs sur le
fondement de la **loi 31-13** relative au droit d'accès à l'information, qui couvre
les Agences Urbaines en tant qu'organismes publics. Modèle disponible sur le portail
**chafafiya.ma** (Commission du droit d'accès à l'information).

Plan C : digitalisation manuelle des planches PDF du PAU si elles sont publiées sur
le portail Casaurba ou récupérables auprès de la commune d'Aïn Chock — voir
[scripts/README.md](../scripts/README.md) pour le pipeline de géoréférencement.
