# 🚐 Raha

*Votre trajet, notre priorité.*

Plateforme de réservation de transport pour la **Grande Comore** (Ngazidja) :
bus, taxis, voitures privées et camions — façon Uber, avec suivi en temps réel
sur carte et une plateforme dédiée pour les agences.

Le projet est composé de **3 briques indépendantes** :

```
comoro-move/
├── backend/    → API REST + temps réel (Node.js, Express, PostgreSQL, Socket.io)
├── mobile/     → Application mobile usagers (React Native / Expo)
└── admin/      → Plateforme web des agences (Next.js)
```

## 1. Vue d'ensemble fonctionnelle

**Côté usager (app mobile)**
- Choisir un type de véhicule : bus, taxi, voiture, camion
- Chercher un trajet (bus/taxi partagé) par origine/destination/date, ou parcourir les agences
- Réserver : préférence de siège, nombre de passagers, motif du déplacement
  (mariage, déménagement, course, voyage pro...), remarques
- Payer en ligne (Mobile Money) ou à bord (cash)
- Suivre le véhicule en temps réel sur la carte (comme Uber), voir le trajet, contacter le chauffeur
- Consulter l'historique de ses réservations

**Côté agence (plateforme web admin)**
- Un admin par agence (compte créé après validation par la plateforme)
- Gérer sa flotte de véhicules (bus/taxis/voitures/camions) et leurs prix
- Gérer ses chauffeurs et les affecter à un véhicule
- Programmer des trajets (ex: Bus Moroni → Mitsamiouli, demain 9h, 1500 KMF/place)
- Voir et traiter les réservations : confirmer, encaisser le paiement à bord, annuler
- Tableau de bord avec statistiques

## 2. Stack technique

| Brique   | Techno                                                             |
|----------|---------------------------------------------------------------------|
| Backend  | Node.js, Express, PostgreSQL (Prisma ORM), Socket.io, JWT           |
| Mobile   | React Native + Expo (TypeScript), react-native-maps (Google Maps)   |
| Admin    | Next.js 14 (App Router), TailwindCSS                                |

## 3. Installation — Backend

```bash
cd backend
cp .env.example .env
# Renseignez DATABASE_URL (PostgreSQL), JWT_SECRET, et vos clés
# Mobile Money / Google Maps quand vous les aurez

npm install
npx prisma migrate dev --name init   # crée les tables
npm run seed                         # données de démo (2 agences, véhicules, 1 trajet)
npm run dev                          # démarre l'API sur http://localhost:4000
```

Compte admin agence de démo créé par le seed :
`admin@karthala.km` / `password123`

## 4. Installation — Application mobile

```bash
cd mobile
npm install
```

Avant de lancer, ouvrez `src/services/api.ts` et `src/services/socket.ts` et
remplacez `http://localhost:4000` par l'adresse IP de votre machine sur le
réseau local (ex: `http://192.168.1.10:4000`) si vous testez sur un vrai
téléphone — `localhost` ne fonctionne que dans le simulateur.

```bash
npx expo start
```

Scannez le QR code avec l'app **Expo Go** (Android/iOS) pour tester
immédiatement sur votre téléphone.

### Clé Google Maps (obligatoire pour la carte)
1. Créez un projet sur [Google Cloud Console](https://console.cloud.google.com/)
2. Activez "Maps SDK for Android" et "Maps SDK for iOS"
3. Générez une clé API et placez-la dans `mobile/app.json` :
   - `expo.ios.config.googleMapsApiKey`
   - `expo.android.config.googleMaps.apiKey`

### Publier sur Play Store / App Store
Ce projet utilise **Expo**, ce qui simplifie énormément la publication :
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # génère un .aab pour le Play Store
eas build --platform ios       # génère un .ipa pour l'App Store
eas submit --platform android  # soumission directe au Play Store
eas submit --platform ios      # soumission directe à l'App Store
```
Vous aurez besoin d'un compte développeur Google Play (25$ une fois) et
d'un compte Apple Developer (99$/an).

## 5. Installation — Plateforme admin (agences)

```bash
cd admin
cp .env.local.example .env.local
# Renseignez NEXT_PUBLIC_API_URL avec l'URL de votre backend déployé

npm install
npm run dev     # http://localhost:3000
```

Connectez-vous avec le compte de démo `admin@karthala.km` / `password123`.

## 6. Déploiement en production (suggestions)

- **Backend** : Railway, Render, Fly.io ou un VPS (avec PostgreSQL managé type
  Neon/Supabase). Pensez à passer `cors` en liste blanche stricte et à activer
  HTTPS.
- **Admin** : Vercel (fait pour Next.js) ou le même VPS que le backend.
- **Mobile** : build via `eas build`, distribution via Play Store / App Store
  (ou TestFlight / tests internes Play Console en attendant la validation).
- **Paiement Mobile Money** : le fichier
  `backend/src/controllers/payment.controller.js` contient un point d'intégration
  clairement marqué `TODO` — à brancher sur l'agrégateur comorien de votre choix
  (HolluPay, MHC, etc.) une fois le contrat signé avec eux.

## 7. Ce qui est prêt à l'emploi vs à finaliser

✅ Prêt : architecture complète, modèle de données, authentification,
réservation des 3 types de trajets, suivi GPS temps réel, tableau de bord
agence, design sur-mesure.

⚠️ À finaliser avant mise en production réelle :
- Branchement réel à un agrégateur Mobile Money comorien (actuellement simulé)
- Génération/scan de QR code de titre de transport (peut être ajouté)
- Notifications push (Expo Notifications — structure prête à l'accueillir via
  le modèle `Notification`)
- Vérification d'identité des chauffeurs/agences (KYC) avant validation
- Politique de confidentialité & CGU (obligatoires pour Play Store/App Store)
- Emplacement GPS envoyé par une app chauffeur dédiée ou une vue simplifiée
  côté admin (le canal Socket.io `driver:location` est déjà prêt à les recevoir)

## 8. Architecture des données (résumé)

`Agency` (agence) → possède plusieurs `Vehicle` (véhicules) et `Driver`
(chauffeurs) → un `Vehicle` peut avoir plusieurs `Trip` (trajets programmés)
→ un `User` (usager) crée des `Booking` (réservations) liées à un `Vehicle`
et éventuellement un `Trip` → chaque `Booking` a un `Payment` associé et peut
recevoir des `LocationPing` (positions GPS) en temps réel pendant le trajet.

Voir `backend/prisma/schema.prisma` pour le détail complet.
