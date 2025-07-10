import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Récupérer une valeur depuis AsyncStorage
 * @param key - Clé de la valeur à récupérer
 * @returns La valeur stockée ou null si non trouvée
 */
export const getItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    return null;
  }
};

/**
 * Stocker une valeur dans AsyncStorage
 * @param key - Clé sous laquelle stocker la valeur
 * @param value - Valeur à stocker
 * @returns Promise void
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données:', error);
    throw error;
  }
};

/**
 * Supprimer une valeur dans AsyncStorage
 * @param key - Clé de la valeur à supprimer
 * @returns Promise void
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Erreur lors de la suppression des données:', error);
    throw error;
  }
};

/**
 * Effacer toutes les données d'AsyncStorage
 * @returns Promise void
 */
export const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Erreur lors du nettoyage du stockage:', error);
    throw error;
  }
};
