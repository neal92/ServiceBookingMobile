import axios from 'axios';
import { Alert } from 'react-native';
import { API_URL } from '../config/api';

/**
 * Fonction utilitaire pour tester la connectivité avec le serveur
 * Utile pour diagnostiquer les problèmes de connexion
 */
export const testAPIConnection = async () => {
  try {
    console.log('Testant la connexion à:', API_URL);
    
    // Test avec un timeout court
    const response = await axios.get(`${API_URL}/ping`, {
      timeout: 5000,
    }).catch(async (error) => {
      // Si le ping échoue, essayons la racine de l'API
      return await axios.get(API_URL, {
        timeout: 5000,
      });
    });
    
    console.log('Connexion réussie:', response.status);
    return {
      success: true,
      status: response.status,
      message: 'Connexion au serveur établie avec succès'
    };
  } catch (error) {
    console.error('Erreur de connexion au serveur:', error);
    
    // Fournir des détails sur l'erreur
    let errorDetails = 'Erreur inconnue';
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        errorDetails = 'Timeout - Le serveur met trop de temps à répondre';
      } else if (error.code === 'ENOTFOUND') {
        errorDetails = 'Hôte non trouvé - Vérifiez l\'adresse IP/URL';
      } else if (error.code === 'ECONNREFUSED') {
        errorDetails = 'Connexion refusée - Le serveur est-il en cours d\'exécution?';
      } else if (error.response) {
        errorDetails = `Code ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        errorDetails = 'Pas de réponse reçue du serveur';
      } else {
        errorDetails = error.message;
      }
    }
    
    return {
      success: false,
      error: errorDetails,
      message: 'Impossible de se connecter au serveur'
    };
  }
};

/**
 * Tester la connexion et afficher le résultat dans une alerte
 */
export const testAndShowAPIConnection = async () => {
  const result = await testAPIConnection();
  
  if (result.success) {
    Alert.alert(
      'Connexion réussie',
      `Le serveur est accessible à l'adresse ${API_URL}.\nStatut: ${result.status}`,
      [{ text: 'OK' }]
    );
  } else {
    Alert.alert(
      'Erreur de connexion',
      `Impossible de se connecter au serveur à l'adresse ${API_URL}.\n\nDétails: ${result.error}\n\nVérifiez que:\n1. Le serveur est en cours d'exécution\n2. L'adresse IP est correcte\n3. Votre appareil et le serveur sont sur le même réseau\n4. Les ports ne sont pas bloqués par un pare-feu`,
      [{ text: 'OK' }]
    );
  }
  
  return result;
};
