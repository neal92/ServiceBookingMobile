import apiClient from '../utils/api';
import { Appointment, CreateAppointmentRequest } from '../types/index';

/**
 * Récupérer tous les rendez-vous d'un utilisateur
 * @param token - Token d'authentification
 * @returns Liste des rendez-vous
 */
export const getUserAppointments = async (token: string) => {
  try {
    const response = await apiClient.get(
      `/appointments`, 
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Créer un nouveau rendez-vous
 * @param appointmentData - Données du rendez-vous
 * @param token - Token d'authentification
 * @returns Rendez-vous créé
 */
export const createAppointment = async (appointmentData: CreateAppointmentRequest, token: string) => {
  try {
    console.log('📋 Données envoyées à l\'API:', appointmentData);
    const response = await apiClient.post(
      `/appointments`, 
      appointmentData, 
      { headers: { Authorization: `Bearer ${token}` }}
    );
    console.log('✅ Réponse de l\'API:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la création du rendez-vous:', error);
    throw error;
  }
};

/**
 * Mettre à jour un rendez-vous
 * @param appointmentId - ID du rendez-vous
 * @param appointmentData - Nouvelles données du rendez-vous
 * @param token - Token d'authentification
 * @returns Rendez-vous mis à jour
 */
export const updateAppointment = async (
  appointmentId: string, 
  appointmentData: Partial<Appointment>, 
  token: string
) => {
  try {
    const response = await apiClient.put(
      `/appointments/${appointmentId}`, 
      appointmentData, 
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Supprimer un rendez-vous
 * @param appointmentId - ID du rendez-vous
 * @param token - Token d'authentification
 * @returns Confirmation de suppression
 */
export const deleteAppointment = async (appointmentId: string, token: string) => {
  try {
    const response = await apiClient.delete(
      `/appointments/${appointmentId}`, 
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Récupérer les rendez-vous d'un utilisateur par son ID (admin ou debug)
 * @param userId - ID de l'utilisateur
 * @param token - Token d'authentification
 * @returns Liste des rendez-vous de l'utilisateur
 */
export const getAppointmentsByUserId = async (userId: string, token: string) => {
  try {
    const response = await apiClient.get(
      `/appointments/user/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Vérifier la disponibilité des créneaux pour une date donnée
 * @param date - Date au format ISO (YYYY-MM-DD)
 * @param serviceId - ID du service (optionnel)
 * @returns Liste des créneaux avec leur disponibilité ou null si l'API n'est pas disponible
 */
export const getAvailableTimeSlots = async (date: string, serviceId?: string) => {
  try {
    const params = new URLSearchParams({ date });
    if (serviceId) {
      params.append('serviceId', serviceId);
    }
    
    const response = await apiClient.get(`/appointments/availability?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    // Si l'endpoint n'existe pas (404), retourner null pour utiliser les créneaux par défaut
    if (error.response?.status === 404 || error.status === 404) {
      console.log('Endpoint de disponibilité non implémenté sur le serveur, utilisation des créneaux par défaut');
      return null;
    }
    // Pour les autres erreurs, les propager
    throw error;
  }
};

/**
 * Vérifier si un créneau spécifique est disponible
 * @param date - Date au format ISO (YYYY-MM-DD)
 * @param time - Heure au format HH:MM
 * @returns Boolean indiquant si le créneau est disponible
 */
export const checkTimeSlotAvailability = async (date: string, time: string) => {
  try {
    const response = await apiClient.get(`/appointments/check/${date}/${time}`);
    return response.data;
  } catch (error: any) {
    // Si l'endpoint n'existe pas (404), considérer le créneau comme disponible
    if (error.response?.status === 404 || error.status === 404) {
      console.log('Endpoint de vérification non implémenté sur le serveur, créneau considéré comme disponible');
      return { available: true };
    }
    // Pour les autres erreurs, les propager
    throw error;
  }
};
