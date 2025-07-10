import apiClient, { API_URL } from '../utils/api';
import { Appointment } from '../types/index';

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
export const createAppointment = async (appointmentData: Partial<Appointment>, token: string) => {
  try {
    const response = await apiClient.post(
      `/appointments`, 
      appointmentData, 
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  } catch (error) {
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
