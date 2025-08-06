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
  phone?: string;
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

  // Récupérer les informations utilisateur
  getMe: async (token: string): Promise<User> => {
    try {
      const response = await apiClient.get<User>('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mettre à jour le stockage local
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      
      return response.data;
    } catch (error: any) {
      console.error('Get me error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des informations');
    }
  },

  // Mettre à jour le profil
  updateProfile: async (profileData: Partial<User>, token: string): Promise<User> => {
    try {
      const response = await apiClient.put<User>('/auth/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mettre à jour le stockage local
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      
      return response.data;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  },

  // Changer le mot de passe
  changePassword: async (passwordData: { currentPassword: string; newPassword: string }, token: string): Promise<void> => {
    try {
      await apiClient.put('/auth/password', passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error: any) {
      console.error('Change password error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  },

  // Upload d'avatar
  uploadAvatar: async (imageFile: FormData, token: string): Promise<User> => {
    try {
      const response = await apiClient.post<User>('/auth/avatar', imageFile, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Mettre à jour le stockage local
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      
      return response.data;
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'upload de l\'avatar');
    }
  },
  
  // Fonction pour récupérer tous les utilisateurs (admin seulement)
  getAllUsers: async (token: string): Promise<User[]> => {
    try {
      const response = await apiClient.get<User[]>('/auth/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
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