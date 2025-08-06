# ServiceBookingMobile 📱

Application mobile de réservation de services développée avec React Native et Expo.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Technologies utilisées](#technologies-utilisées)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)
- [Structure du projet](#structure-du-projet)
- [Écrans disponibles](#écrans-disponibles)
- [Contribution](#contribution)

## 🎯 Vue d'ensemble

ServiceBookingMobile est une application mobile moderne permettant aux utilisateurs de découvrir, filtrer et réserver des services. L'application offre une interface utilisateur intuitive avec un mode sombre/clair, des animations fluides et une gestion complète des rendez-vous.

### Principales caractéristiques :
- 🔐 **Authentification complète** (connexion/inscription)
- 📅 **Système de réservation avancé** avec calendrier interactif
- 🔍 **Filtrage et tri intelligent** des services
- 💬 **Messagerie intégrée** pour la communication
- 👤 **Gestion de profil utilisateur**
- 🌙 **Mode sombre/clair** avec transitions animées
- 📱 **Interface responsive** optimisée mobile

## ✨ Fonctionnalités

### 🏠 Écran d'accueil
- Calendrier interactif pour visualiser les rendez-vous
- Aperçu des services populaires
- Navigation rapide vers les différentes sections

### 🛍️ Catalogue de services
- **Filtrage avancé** par catégorie avec interface collapsible
- **Système de tri** (nom, prix, durée) avec indicateurs visuels
- **Recherche textuelle** en temps réel
- **Cartes de service** avec images, descriptions et pricing
- **Compteur dynamique** des services disponibles

### 📅 Réservation intelligente
- **Calendrier interactif** avec navigation mensuelle
- **Sélection de créneaux horaires** par période (matin/après-midi)
- **Indicateurs de disponibilité** en temps réel
- **Notes personnalisées** pour chaque réservation
- **Résumé complet** avant confirmation

### 📋 Gestion des rendez-vous
- **Vue d'ensemble** de tous les rendez-vous
- **Filtrage par statut** (à venir, passés, annulés)
- **Détails complets** de chaque réservation
- **Historique** des services utilisés

### 💬 Messagerie
- **Communication directe** avec les prestataires
- **Interface moderne** de chat
- **Notifications** en temps réel

### 👤 Profil utilisateur
- **Gestion des informations personnelles**
- **Historique des réservations**
- **Paramètres de l'application**

## 🏗️ Architecture

L'application suit une architecture modulaire avec :

- **Context API** pour la gestion d'état global (authentification, thème)
- **Navigation Stack/Tab** pour une navigation fluide
- **Hooks personnalisés** pour la logique métier
- **Composants réutilisables** pour l'interface
- **API centralisée** avec gestion d'erreurs

## 🛠️ Technologies utilisées

### Frontend Mobile
- **React Native** 0.79.5 - Framework mobile cross-platform
- **Expo** ~53.0.17 - Plateforme de développement
- **TypeScript** ~5.8.3 - Typage statique
- **React Navigation** 7.x - Navigation native

### UI/UX
- **React Native Paper** 5.14.5 - Composants Material Design
- **Ionicons** - Icônes vectorielles
- **Animations API** - Animations fluides natives

### Gestion d'état
- **React Context** - État global
- **React Hooks** - État local et effets
- **Async Storage** - Stockage local persistant

### Réseau & API
- **Axios** 1.10.0 - Client HTTP
- **REST API** - Communication serveur

### Utilitaires
- **date-fns** 4.1.0 - Manipulation des dates
- **Expo Secure Store** - Stockage sécurisé des tokens

## 🚀 Installation

### Prérequis
- Node.js (v16 ou supérieur)
- npm ou yarn
- Expo CLI
- Appareil mobile ou émulateur

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/ServiceBookingMobile.git
cd ServiceBookingMobile
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Configurer l'environnement** (voir section Configuration)

4. **Lancer l'application**
```bash
# Démarrer le serveur de développement
npm start

# Ou directement sur une plateforme
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

## ⚙️ Configuration

### Configuration de l'API

Modifiez le fichier `src/config/api.ts` :

```typescript
export const API_URL = 'http://votre-serveur:5000/api';
```

**Important** : Remplacez `http://172.25.1.22:5000/api` par l'URL de votre serveur backend.

### Variables d'environnement

L'application utilise les configurations suivantes :
- **API_URL** : URL de base de votre API backend
- **Timeout** : Délai d'expiration des requêtes (défaut: 10s)

### Configuration réseau

Pour tester sur un appareil physique, assurez-vous que :
- Votre serveur backend est accessible depuis le réseau
- Les ports nécessaires sont ouverts
- L'adresse IP est correctement configurée

## 📖 Utilisation

### Première utilisation

1. **Inscription/Connexion**
   - Créez un compte ou connectez-vous
   - L'authentification est requise pour accéder aux fonctionnalités

2. **Explorer les services**
   - Parcourez le catalogue depuis l'onglet "Services"
   - Utilisez les filtres pour affiner votre recherche
   - Consultez les détails de chaque service

3. **Réserver un service**
   - Sélectionnez un service
   - Choisissez une date dans le calendrier
   - Sélectionnez un créneau horaire
   - Confirmez votre réservation

4. **Gérer vos rendez-vous**
   - Consultez vos réservations dans l'onglet "Rendez-vous"
   - Filtrez par statut
   - Ajoutez des notes si nécessaire

## 📚 API Documentation

### Swagger Documentation
🔗 **[Documentation API Swagger](http://172.25.1.22:5000/api-docs)**

*Note : Remplacez l'IP par celle de votre serveur backend*

### Endpoints principaux

#### Authentification
- `POST /auth/login` - Connexion utilisateur
- `POST /auth/register` - Inscription utilisateur
- `GET /auth/me` - Récupérer les informations utilisateur connecté (Token requis)
- `PUT /auth/profile` - Mettre à jour le profil utilisateur (Token requis)
- `PUT /auth/password` - Changer le mot de passe (Token requis)
- `POST /auth/avatar` - Upload d'avatar/photo de profil (Token requis)

#### Services
- `GET /services` - Liste des services
- `GET /services/:id` - Détails d'un service
- `GET /services/:id/image` - Image d'un service
- `GET /categories` - Liste des catégories

#### Rendez-vous
- `GET /appointments/client` - Historique des rendez-vous du client connecté (Token requis)
- `POST /appointments` - Créer un rendez-vous
- `PUT /appointments/:id` - Modifier un rendez-vous
- `DELETE /appointments/:id` - Supprimer un rendez-vous

#### Profil
- `GET /profile` - Informations utilisateur (Deprecated - utiliser /auth/me)
- `PUT /profile` - Modifier le profil (Deprecated - utiliser /auth/profile)

## 📁 Structure du projet

```
ServiceBookingMobile/
├── 📱 app.json                 # Configuration Expo
├── 📦 package.json             # Dépendances npm
├── 🔧 tsconfig.json           # Configuration TypeScript
├── 🎯 index.ts                # Point d'entrée
├── 📱 App.tsx                 # Composant racine
├── 🖼️ assets/                 # Ressources statiques
│   ├── icon.png
│   ├── splash-icon.png
│   └── ...
└── 📂 src/
    ├── 🔌 api/                # Clients API
    │   ├── auth.ts           # API authentification
    │   ├── services.ts       # API services
    │   ├── appointments.ts   # API rendez-vous
    │   └── notifications.ts  # API notifications
    ├── 🧩 components/         # Composants réutilisables
    │   ├── auth/             # Composants authentification
    │   ├── appointments/     # Composants rendez-vous
    │   ├── services/         # Composants services
    │   ├── common/           # Composants génériques
    │   └── navigation/       # Composants navigation
    ├── ⚙️ config/             # Configuration
    │   ├── api.ts           # Config API
    │   └── index.ts         # Export config
    ├── 🌍 contexts/           # Contexts React
    │   ├── AuthContext.tsx  # Context authentification
    │   └── ThemeContext.tsx # Context thème
    ├── 🎣 hooks/              # Hooks personnalisés
    │   └── useAuth.ts       # Hook authentification
    ├── 🧭 navigation/         # Configuration navigation
    │   ├── AppNavigator.tsx # Navigation principale
    │   ├── AuthNavigator.tsx# Navigation auth
    │   ├── TabNavigator.tsx # Navigation onglets
    │   └── types.ts         # Types navigation
    ├── 📱 screens/            # Écrans de l'application
    │   ├── app/             # Écrans principaux
    │   │   ├── HomeScreen.tsx       # 🏠 Accueil
    │   │   ├── ServicesScreen.tsx   # 🛍️ Services
    │   │   ├── AppointmentsScreen.tsx # 📅 Rendez-vous
    │   │   ├── MessagingScreen.tsx  # 💬 Messages
    │   │   └── ProfileScreen.tsx    # 👤 Profil
    │   └── auth/            # Écrans authentification
    │       ├── LoginScreen.tsx      # 🔐 Connexion
    │       └── RegisterScreen.tsx   # ✍️ Inscription
    ├── 🎨 theme/              # Styles et thèmes
    │   └── styles.ts        # Feuilles de style
    ├── 📝 types/              # Définitions TypeScript
    │   ├── index.ts         # Types principaux
    │   └── navigation.ts    # Types navigation
    └── 🛠️ utils/              # Utilitaires
        ├── api.ts           # Utilitaires API
        ├── date.ts          # Utilitaires dates
        ├── networkUtils.ts  # Utilitaires réseau
        └── storage.ts       # Utilitaires stockage
```

## 📱 Écrans disponibles

### 🔐 Authentification
- **LoginScreen** : Connexion avec email/mot de passe
- **RegisterScreen** : Inscription de nouveaux utilisateurs

### 🏠 Écran principal
- **HomeScreen** : Dashboard avec calendrier et aperçu

### 🛍️ Services
- **ServicesScreen** : 
  - Catalogue complet des services
  - Filtrage par catégorie (collapsible)
  - Tri par nom, prix, durée
  - Recherche textuelle
  - Cartes détaillées avec images
  - Réservation directe

### 📅 Rendez-vous
- **AppointmentsScreen** :
  - Liste de tous les rendez-vous
  - Filtrage par statut
  - Détails complets
  - Gestion des notes

### 💬 Messages
- **MessagingScreen** : Interface de chat moderne

### 👤 Profil
- **ProfileScreen** : Gestion du profil utilisateur

## 🎨 Personnalisation

### Thèmes
L'application supporte deux thèmes :
- **Mode clair** : Interface lumineuse
- **Mode sombre** : Interface sombre pour un confort visuel

### Couleurs principales
```typescript
// Mode clair
primary: '#3498db'
background: '#f8f9fa'
surface: '#ffffff'

// Mode sombre  
primary: '#60A5FA'
background: '#111827'
surface: '#1F2937'
```

### Animations
- Transitions fluides entre écrans
- Animations de chargement
- Feedback visuel sur les interactions
- Transitions thème avec interpolation

## 🔧 Développement

### Scripts disponibles

```bash
# Développement
npm start          # Lancer Expo
npm run android    # Lancer sur Android
npm run ios        # Lancer sur iOS
npm run web        # Lancer sur web

# Debug
npx expo doctor    # Diagnostiquer les problèmes
npx expo install   # Installer les dépendances compatibles
```

### Debug et tests

#### Test de connectivité API
L'application inclut un système de test de connectivité :
- Bouton de test dans l'en-tête des écrans
- Vérification automatique de la connexion
- Messages d'erreur informatifs

#### Logs utiles
```bash
# Logs généraux
npx expo logs

# Logs spécifiques Android
npx expo logs --android

# Logs spécifiques iOS  
npx expo logs --ios
```

## 🤝 Contribution

### Workflow de développement

1. **Fork** le projet
2. **Créer** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** sur la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Standards de code

- **TypeScript** strict
- **ESLint** pour la qualité du code
- **Prettier** pour le formatage
- **Nommage descriptif** des composants et fonctions
- **Commentaires** pour la logique complexe

### Bonnes pratiques

- **Composants fonctionnels** avec hooks
- **Gestion d'erreur** systématique
- **Loading states** pour l'UX
- **Responsive design** mobile-first
- **Accessibilité** (labels, contraste)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Équipe

- **Développement** : Votre équipe
- **Design** : Votre équipe  
- **Backend** : Votre équipe

## 📞 Support

Pour toute question ou problème :

1. **Issues GitHub** : Créez une issue détaillée
2. **Documentation** : Consultez ce README
3. **API Docs** : [Swagger Documentation](http://172.25.1.22:5000/api-docs)
4. **Email Support** : support@servicebooking.com
5. **Support Téléphonique** : +33 1 23 45 67 89
6. **Site Web** : servicebooking.com

### 🆘 Aide intégrée

L'application dispose d'une section **"Aide et Support"** accessible depuis le profil utilisateur qui inclut :

- **Contact direct** : Email, téléphone et site web
- **Documentation API** : Accès direct au Swagger
- **FAQ intégrée** : Réponses aux questions fréquentes
- **Guide d'utilisation** : Instructions détaillées
- **Informations techniques** : Version, build et plateforme

### 🔧 Résolution de problèmes

#### Problèmes de connexion
- Utilisez le bouton de test de connectivité dans l'en-tête
- Vérifiez l'URL de l'API dans `src/config/api.ts`
- Assurez-vous que le serveur backend est accessible

#### Erreurs de réservation
- Vérifiez votre token d'authentification
- Consultez les logs dans la console de développement
- Testez l'API directement via Swagger

#### Interface utilisateur
- Redémarrez l'application en cas de problème d'affichage
- Vérifiez les permissions pour l'appareil photo (upload d'avatar)
- Consultez la FAQ dans l'application pour les questions courantes

---

## 🚀 Prochaines fonctionnalités

- [ ] Notifications push
- [ ] Paiement intégré
- [ ] Évaluation des services
- [ ] Chat en temps réel
- [ ] Géolocalisation des prestataires
- [ ] Mode hors ligne
- [ ] Export PDF des factures

---

**ServiceBookingMobile** - Simplifiez vos réservations de services 📱✨
