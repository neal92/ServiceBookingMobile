import apiClient from '../utils/api';
import { Notification } from '../types/index';

/**
 * Récupérer toutes les notifications d'un utilisateur
 * @param token - Token d'authentification
 * @returns Liste des notifications
 */
export const getUserNotifications = async (token: string): Promise<Notification[]> => {
  try {
    const response = await apiClient.get(
      `/notifications`, 
      { headers: { Authorization: `Bearer ${token}` }}
    );
    return response.data;
  } catch (error) {
    // En cas d'erreur API, retourner des notifications par défaut
    console.error('Erreur lors de la récupération des notifications:', error);
    return [
      {
        id: '1',
        title: 'Rappel de rendez-vous',
        message: 'Rappel: RDV coiffure demain à 14h30',
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // il y a 2h
        type: 'appointment',
        data: { appointmentId: 'apt-1' }
      },
      {
        id: '2',
        title: 'Nouvelle promotion',
        message: 'Nouvelle promotion: -20% sur les soins du visage',
        read: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // il y a 1j
        type: 'promo'
      },
      {
        id: '3',
        title: 'Mise à jour des horaires',
        message: 'Votre salon préféré a mis à jour ses horaires',
        read: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // il y a 3j
        type: 'system'
      }
    ];
  }
};

/**
 * Marquer une notification comme lue
 * @param notificationId - ID de la notification
 * @param token - Token d'authentification
 */
export const markNotificationAsRead = async (notificationId: string, token: string) => {
  try {
    await apiClient.put(
      `/notifications/${notificationId}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` }}
    );
  } catch (error) {
    console.error('Erreur lors du marquage de la notification:', error);
    throw error;
  }
};

/**
 * Supprimer une notification
 * @param notificationId - ID de la notification
 * @param token - Token d'authentification
 */
export const deleteNotification = async (notificationId: string, token: string) => {
  try {
    await apiClient.delete(
      `/notifications/${notificationId}`,
      { headers: { Authorization: `Bearer ${token}` }}
    );
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error);
    throw error;
  }
};
