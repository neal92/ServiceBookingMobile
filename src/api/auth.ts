import apiClient from '../utils/api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interfaces
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  pseudo?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  pseudo?: string;
  role?: "user" | "admin";
  userType?: "client" | "professional";
}

interface AuthResponse {
  token: string;
  user: User;
}

// Fonctions d'API
const authAPI = {
  // Fonction de connexion
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      // S'assurer que l'email est propre avant l'envoi
      const cleanedCredentials = {
        email: credentials.email.trim(),
        password: credentials.password
      };
      
      const response = await apiClient.post<AuthResponse>('/auth/login', cleanedCredentials);
      
      // Stocker le token et l'utilisateur
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Erreur de connexion');
    }
  },
  
  // Fonction d'inscription
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      // S'assurer que l'email et le pseudo sont propres avant l'envoi
      userData.email = userData.email.trim();
      if (userData.pseudo) {
        userData.pseudo = userData.pseudo.toLowerCase().trim();
      }
      
      const response = await apiClient.post<AuthResponse>('/auth/register', userData);
      
      // Stocker le token et l'utilisateur
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  },
  
  // Fonction de déconnexion
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },
  
  // Vérifier si l'utilisateur est connecté
  getCurrentUser: async (): Promise<{ user: User | null; token: string | null }> => {
    try {
      const userString = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      return {
        user: userString ? JSON.parse(userString) : null,
        token: token
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, token: null };
    }
  },
};

export default authAPI;