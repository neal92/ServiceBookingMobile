# ServiceBookingMobile - Documentation Complète

## 📋 Vue d'ensemble du projet

**ServiceBookingMobile** est une application React Native développée avec Expo qui permet aux clients de réserver des rendez-vous auprès de prestataires de services (coiffeurs, esthéticiens, etc.). L'application offre une interface moderne avec un mode sombre/clair et une gestion complète des rendez-vous.

## 🏗️ Architecture du projet

### Stack technique
- **Frontend**: React Native (v0.79.5) avec TypeScript
- **Framework**: Expo (v53.0.17)
- **Navigation**: React Navigation v7
- **UI Components**: React Native Paper + Expo Vector Icons
- **État global**: React Context (AuthContext, ThemeContext)
- **Stockage local**: AsyncStorage + Expo SecureStore
- **Gestion des dates**: date-fns
- **Client HTTP**: Axios

### Structure des dossiers
```
ServiceBookingMobile/
├── assets/                 # Images et icônes
├── src/
│   ├── api/               # Appels API
│   │   ├── auth.ts        # Authentification
│   │   ├── appointments.ts # Gestion des RDV
│   │   ├── services.ts    # Services disponibles
│   │   └── notifications.ts # Notifications
│   ├── components/        # Composants réutilisables
│   │   ├── appointments/  # Composants liés aux RDV
│   │   ├── auth/          # Composants d'authentification
│   │   ├── common/        # Composants génériques
│   │   └── navigation/    # Composants de navigation
│   ├── config/           # Configuration
│   ├── contexts/         # Contexts React
│   ├── hooks/            # Hooks personnalisés
│   ├── navigation/       # Structure de navigation
│   ├── screens/          # Écrans de l'application
│   ├── theme/            # Styles et thèmes
│   ├── types/            # Types TypeScript
│   └── utils/            # Utilitaires
```

## 🔄 Architecture de Navigation

### Structure hiérarchique
```
NavigationContainer
└── AppNavigator (Stack)
    └── TabNavigator (Bottom Tabs)
        ├── HomeTab
        ├── ServicesTab
        ├── AppointmentsTab (si connecté)
        ├── MessagingTab (si connecté)
        ├── ProfileTab (si connecté)
        └── AuthTab (si non connecté)
            ├── Login
            └── Register
```

### Routes principales
- **RootStackParamList**:
  - `Tabs`: Navigation par onglets
  - `Services`: Liste des services avec paramètre serviceId optionnel
  - `ServiceDetail`: Détails d'un service
  - `AppointmentDetail`: Détails d'un rendez-vous

- **TabParamList**:
  - `HomeTab`: Écran d'accueil avec calendrier
  - `ServicesTab`: Catalogue des services
  - `AppointmentsTab`: Gestion des rendez-vous
  - `MessagingTab`: Messagerie (futur)
  - `ProfileTab`: Profil utilisateur
  - `AuthTab`: Authentification

## 🌐 API et Backend

### Configuration API
- **URL de base**: `http://172.25.1.22:5000/api`
- **Authentification**: Bearer Token (JWT)
- **Timeout**: 30 secondes

### Endpoints principaux

#### Authentification (`/auth`)
```typescript
POST /auth/login
Body: { email: string, password: string }
Response: { user: User, token: string }

POST /auth/register  
Body: { firstName: string, lastName?: string, email: string, password: string, pseudo?: string, role?: string, userType?: string }
Response: { user: User, token: string }
```

#### Rendez-vous (`/appointments`)
```typescript
GET /appointments
Headers: Authorization: Bearer <token>
Response: Appointment[]

GET /appointments/client?email=xxx
Response: Appointment[]

GET /appointments/:id
Response: Appointment

GET /appointments/check/:date/:time
Response: { available: boolean, message: string }

POST /appointments
Body: { clientName: string, clientEmail: string, clientPhone?: string, serviceId: string, date: string, time: string, notes?: string, createdBy?: string }
Response: { id: number, message: string }

POST /appointments/admin
Headers: Authorization: Bearer <token>
Body: { clientName: string, clientEmail: string, clientPhone?: string, serviceId: string, date: string, time: string, notes?: string }
Response: { id: number, message: string }

PUT /appointments/:id
Headers: Authorization: Bearer <token>
Body: { clientName?: string, clientEmail?: string, clientPhone?: string, serviceId?: string, date?: string, time?: string, status?: string, notes?: string }
Response: void

PATCH /appointments/:id/status
Headers: Authorization: Bearer <token>
Body: { status: 'pending' | 'confirmed' | 'in-progress' | 'cancelled' | 'completed' }
Response: void

DELETE /appointments/:id
Headers: Authorization: Bearer <token>
Response: void

**Note importante**: L'endpoint `/appointments/availability` n'est pas implémenté sur le serveur. 
Le client utilise des créneaux par défaut et vérifie individuellement avec `/appointments/check/:date/:time`
```

#### Services (`/services`)
```typescript
GET /services
Headers: Authorization: Bearer <token> (optionnel)
Response: Service[]

GET /services/:id
Headers: Authorization: Bearer <token> (optionnel)
Response: Service

GET /services/:id/availability?date=YYYY-MM-DD
Headers: Authorization: Bearer <token>
Response: { slots: TimeSlot[] }

GET /services/:id/image
Response: Image binaire
```

#### Notifications (`/notifications`)
```typescript
GET /notifications
Headers: Authorization: Bearer <token>
Response: Notification[]

PUT /notifications/:id/read
Headers: Authorization: Bearer <token>
Response: void

DELETE /notifications/:id
Headers: Authorization: Bearer <token>
Response: void
```

#### Catégories (`/categories`)
```typescript
GET /categories
Headers: Authorization: Bearer <token> (optionnel)
Response: Category[]
```

## 📱 Écrans et fonctionnalités

### HomeScreen
**Fichier**: `src/screens/app/HomeScreen.tsx`

**Fonctionnalités**:
- Calendrier interactif (vue semaine/mois)
- Statistiques des rendez-vous
- Aperçu des activités du prestataire
- Notifications
- **Réservation rapide via popup** (fonctionnalité principale)

**Popup de réservation**:
1. Sélection du service (liste avec images, prix, durée)
2. Sélection du créneau (créneaux adaptés à la durée du service)
3. Confirmation

**Logique des créneaux**:
- Services ≥60min → créneaux d'1h
- Services ≤30min → créneaux de 30min
- Services 30-60min → créneaux de 45min

### ServicesScreen
**Fichier**: `src/screens/app/ServicesScreen.tsx`

**Fonctionnalités**:
- Catalogue des services avec filtres par catégorie
- Recherche de services
- Réservation avec calendrier modal
- Affichage des rendez-vous existants
- Gestion des créneaux disponibles

### AppointmentsScreen
**Fichier**: `src/screens/app/AppointmentsScreen.tsx`

**Fonctionnalités**:
- Onglets "À venir" / "Passés"
- Liste des rendez-vous avec statuts
- Annulation de rendez-vous
- Suppression définitive des rendez-vous passés

### LoginScreen / RegisterScreen
**Fichiers**: `src/screens/auth/`

**Fonctionnalités**:
- Authentification avec email/mot de passe
- Création de compte
- Gestion des erreurs
- Stockage sécurisé des tokens

## 🔐 Gestion de l'état et authentification

### AuthContext
**Fichier**: `src/contexts/AuthContext.tsx`

**État géré**:
```typescript
{
  user: User | null,
  token: string | null,
  loading: boolean,
  login: (credentials) => Promise<void>,
  register: (userData) => Promise<void>,
  logout: () => Promise<void>
}
```

### ThemeContext
**Fichier**: `src/contexts/ThemeContext.tsx`

**État géré**:
```typescript
{
  isDarkMode: boolean,
  theme: any,
  toggleTheme: () => void
}
```

## 🎨 Système de thème

### Thèmes supportés
- **Mode clair**: Arrière-plans blancs, texte sombre
- **Mode sombre**: Arrière-plans gris foncé (#111827, #1F2937), texte clair

### Couleurs principales
- **Primary**: #4F8EF7 (bleu) / #60A5FA (bleu clair en mode sombre)
- **Success**: #10B981 (vert)
- **Warning**: #F59E0B (orange)  
- **Error**: #EF4444 (rouge)
- **Gray**: #9CA3AF (gris moyen)

## 📊 Types de données

### User
```typescript
interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role?: string;
  phone?: string;
  photoUrl?: string;
  avatar?: string;
  pseudo?: string;
  createdAt?: string;
}
```

### Service
```typescript
interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;  // en minutes
  category: string;
  categoryId?: number;
  categoryName?: string;
  image?: string;    // Nom du fichier image
  imageUrl?: string; // URL complète
  featured?: boolean;
  createdAt?: string;
}
```

### Appointment
```typescript
interface Appointment {
  id: string;
  user: User;
  service: Service;
  date: string;  // ISO date string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}
```

### TimeSlot
```typescript
interface TimeSlot {
  id: string;
  time: string;  // format HH:MM
  available: boolean;
  period?: 'morning' | 'afternoon';
}
```

### Notification
```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'appointment' | 'promo' | 'system';
  data?: {
    appointmentId?: string;
    serviceId?: string;
  };
}
```

## 🔧 Utilitaires et helpers

### apiClient (utils/api.ts)
- Client Axios configuré avec intercepteurs
- Gestion automatique des tokens
- Logging des requêtes/réponses
- Gestion des erreurs réseau

### Gestion des dates (utils/date.ts)
- Formatage des dates
- Comparaisons temporelles
- Génération de créneaux

### Stockage (utils/storage.ts)
- Wrapper pour AsyncStorage
- Stockage sécurisé avec SecureStore

## 🚀 Installation et démarrage

### Prérequis
```bash
node >= 18
npm ou yarn
Expo CLI
```

### Installation
```bash
npm install
```

### Scripts disponibles
```bash
npm start      # Démarrer Expo
npm run android # Lancer sur Android
npm run ios    # Lancer sur iOS
npm run web    # Lancer sur web
```

## 🎯 Fonctionnalités clés

### 1. Réservation rapide (HomeScreen)
- Popup intégrée avec deux étapes
- Sélection de service avec images
- Créneaux adaptés à la durée du service
- Confirmation instantanée

### 2. Gestion des créneaux intelligente
- Génération automatique selon la durée
- Vérification de disponibilité via API
- Fallback sur créneaux par défaut

### 3. Interface responsive
- Support mode sombre/clair
- Animations fluides
- Composants adaptés à tous les écrans

### 4. Gestion d'état robuste
- Contexts React pour l'authentification et le thème
- Synchronisation avec le backend
- Gestion des erreurs réseau

## 🔍 Points d'intérêt pour une IA

### Patterns architecturaux
- **Navigation conditionnelle** : Affichage d'onglets différents selon l'état d'authentification
- **Gestion d'état global** : Utilisation des Contexts pour partager l'état
- **Composition de composants** : Séparation claire entre logique et présentation
- **Types TypeScript stricts** : Typage complet des données et props

### Logique métier notable
- **Génération de créneaux dynamiques** : Adaptation des disponibilités selon la durée des services
- **Système de thème complet** : Mode sombre/clair avec persistance
- **Gestion des erreurs réseau** : Fallbacks et retry logic
- **Optimisations UI** : Animations, lazy loading, optimisation des rendus

### Défis techniques résolus
- **Modal complexe** : Popup de réservation avec navigation entre étapes
- **Calendrier interactif** : Vues semaine/mois avec animations
- **Synchronisation API** : Gestion des tokens, refresh des données
- **Responsive design** : Adaptation aux différentes tailles d'écran

Cette documentation fournit une vue complète du projet pour permettre à une IA de comprendre l'architecture, les patterns utilisés, et la logique métier implémentée.
