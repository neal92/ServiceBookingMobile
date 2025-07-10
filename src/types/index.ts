// Exporter les types de navigation
export * from './navigation';

// Types pour l'authentification
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  createdAt: string;
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}

// Types pour les services
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;  // en minutes
  category: string;
  imageUrl: string;
  featured?: boolean;
}

// Type pour les créneaux horaires disponibles
export interface TimeSlot {
  id: string;
  time: string;  // format HH:MM
  available: boolean;
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
