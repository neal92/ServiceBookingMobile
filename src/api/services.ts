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

/**
 * Récupérer l'URL de l'image d'un service
 * @param serviceId - ID du service
 * @param imageName - Nom du fichier image
 * @returns URL complète de l'image
 */
export const getServiceImageUrl = (serviceId: string, imageName: string) => {
  if (!imageName) return null;
  
  // Si l'image commence déjà par http, la retourner telle quelle
  if (imageName.startsWith('http')) {
    return imageName;
  }
  
  // Sinon, construire l'URL avec l'API_URL
  return `/services/${serviceId}/image/${imageName}`;
};

/**
 * Vérifier si une image de service existe
 * @param serviceId - ID du service
 * @param imageName - Nom du fichier image
 * @param token - Token d'authentification (optionnel)
 * @returns Boolean indiquant si l'image existe
 */
export const checkServiceImageExists = async (serviceId: string, imageName: string, token?: string) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiClient.head(`/services/${serviceId}/image/${imageName}`, { headers });
    return response.status === 200;
  } catch (error) {
    console.log(`Image ${imageName} not found for service ${serviceId}`);
    return false;
  }
};
