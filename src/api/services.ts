import apiClient from '../utils/api';
import { Service } from '../types/index';

/**
 * Récupérer tous les services disponibles
 * @param token - Token d'authentification (optionnel selon l'API)
 * @returns Liste des services
 */
export const getAllServices = async (token?: string) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.get(`/services`, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Récupérer les détails d'un service spécifique
 * @param serviceId - ID du service
 * @param token - Token d'authentification (optionnel selon l'API)
 * @returns Détails du service
 */
export const getServiceDetails = async (serviceId: string, token?: string) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.get(`/services/${serviceId}`, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Récupérer les créneaux disponibles pour un service
 * @param serviceId - ID du service
 * @param date - Date pour laquelle vérifier les disponibilités
 * @param token - Token d'authentification
 * @returns Liste des créneaux disponibles
 */
export const getServiceAvailability = async (serviceId: string, date: string, token: string) => {
  try {
    const response = await apiClient.get(
      `/services/${serviceId}/availability`, 
      { 
        params: { date },
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Récupérer toutes les catégories de services
 * @param token - Token d'authentification (optionnel selon l'API)
 * @returns Liste des catégories
 */
export const getAllCategories = async (token?: string) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.get(`/categories`, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};
