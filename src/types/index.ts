// Exporter les types de navigation
export * from './navigation';

// Types pour l'authentification
export interface User {
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

export interface AuthResponse {
  user: User;
  token: string;
}

// Types pour les rendez-vous
export interface Appointment {
  id: string;
  user: User;
  service: Service;
  date: string;  // ISO date string
  time?: string; // Format HH:MM (optionnel pour compatibilité avec données existantes)
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}

// Type pour créer un nouveau rendez-vous (structure attendue par l'API)
export interface CreateAppointmentRequest {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceId: string;
  date: string;      // Format YYYY-MM-DD
  time: string;      // Format HH:MM
  notes?: string;
  createdBy: string;
}

// Types pour les services
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;  // en minutes
  category: string;
  categoryId?: number;
  categoryName?: string;
  image?: string;    // Nom du fichier image
  imageUrl?: string; // URL complète (optionnelle pour compatibilité)
  featured?: boolean;
  createdAt?: string;
}

// Type pour les créneaux horaires disponibles
export interface TimeSlot {
  id: string;
  time: string;  // format HH:MM
  available: boolean;
  period?: 'morning' | 'afternoon';
}

// Type pour les catégories de services
export interface Category {
  id: string;
  name: string;
  icon: string;
}

// Type pour les méthodes de paiement
export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  last4?: string;
  expiry?: string;
  default: boolean;
}

// Type pour les notifications
export interface Notification {
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

// Type pour les avis
export interface Review {
  id: string;
  user: User;
  service: Service;
  rating: number;  // 1 à 5
  comment?: string;
  date: string;
}
