import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Utilitaires pour la gestion de l'authentification
 */

/**
 * Nettoie complètement les données d'authentification stockées
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(['token', 'user']);
    console.log('✅ Données d\'authentification nettoyées');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des données d\'authentification:', error);
  }
};

/**
 * Vérifie si une erreur est liée à l'expiration du token
 */
export const isTokenExpiredError = (error: any): boolean => {
  if (!error.response) return false;
  
  const { status, data } = error.response;
  
  return (
    status === 401 && 
    (
      data?.code === 'TOKEN_EXPIRED' ||
      data?.message?.includes('expired') ||
      data?.message?.includes('session has expired') ||
      data?.message?.includes('unauthorized')
    )
  );
};

/**
 * Affiche une alerte d'expiration de session avec options
 */
export const showSessionExpiredAlert = (onConfirm?: () => void): void => {
  Alert.alert(
    'Session expirée',
    'Votre session a expiré. Vous devez vous reconnecter pour continuer.',
    [
      {
        text: 'Me reconnecter',
        onPress: () => {
          console.log('👤 Utilisateur choisit de se reconnecter');
          onConfirm?.();
        }
      }
    ],
    { cancelable: false }
  );
};

/**
 * Gère automatiquement l'expiration du token
 */
export const handleTokenExpiration = async (onExpired?: () => void): Promise<void> => {
  console.log('🔑 Gestion de l\'expiration du token...');
  
  // Nettoyer les données locales
  await clearAuthData();
  
  // Afficher l'alerte
  showSessionExpiredAlert(onExpired);
};

/**
 * Valide le format d'un token JWT
 */
export const isValidTokenFormat = (token: string): boolean => {
  if (!token) return false;
  
  // Un JWT basique a 3 parties séparées par des points
  const parts = token.split('.');
  return parts.length === 3;
};

/**
 * Extrait l'expiration d'un token JWT (si possible)
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    if (!isValidTokenFormat(token)) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    if (payload.exp) {
      return new Date(payload.exp * 1000);
    }
    
    return null;
  } catch (error) {
    console.warn('⚠️ Impossible d\'extraire l\'expiration du token:', error);
    return null;
  }
};

/**
 * Vérifie si un token est expiré (côté client)
 */
export const isTokenExpiredLocally = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return false;
  
  const now = new Date();
  return now >= expiration;
};
