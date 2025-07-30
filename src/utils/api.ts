import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Importer la configuration de l'API depuis le fichier de configuration
import { API_URL } from '../config/api';

console.log('API URL utilisée:', API_URL); // Log pour debug

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // timeout après 30 secondes (augmenté pour les tests)
  timeoutErrorMessage: 'Le serveur met trop de temps à répondre',
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log pour le debug
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
apiClient.interceptors.response.use(
  (response) => {
    // Log pour le debug
    console.log(`API Response: ${response.status} - ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Log détaillé des erreurs pour faciliter le debug
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'état hors de la plage 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        url: error.config.url,
        method: error.config.method
      });
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('API No Response:', error.request);
      console.error('Request details:', {
        url: error.config.url,
        method: error.config.method,
        baseURL: error.config.baseURL
      });
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('API Config Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;