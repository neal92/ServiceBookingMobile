import React, { createContext, useState, useEffect } from 'react';
import authAPI from '../api/auth';

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

interface RegisterData {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  pseudo?: string;
  role?: "user" | "admin";
  userType?: "client" | "professional";
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
  updateUserData: (userData: User) => void;
  checkTokenValidity: () => Promise<boolean>;
  clearSession: () => void;
}

// Création du contexte
export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  setError: () => {},
  updateUserData: () => {},
  checkTokenValidity: async () => false,
  clearSession: () => {},
});

// Provider du contexte
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { user: currentUser, token: currentToken } = await authAPI.getCurrentUser();
        
        if (currentUser && currentToken) {
          // Vérifier si le token est encore valide en faisant un appel à l'API
          try {
            const validatedUser = await authAPI.getMe(currentToken);
            setUser(validatedUser);
            setToken(currentToken);
            console.log('✅ Token valide, utilisateur restauré');
          } catch (validationError: any) {
            console.log('❌ Token invalide ou expiré, nettoyage...');
            // Token expiré ou invalide, nettoyer
            await authAPI.logout();
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.error("Error loading user:", err);
        // En cas d'erreur, s'assurer que l'état est propre
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Vérification périodique du token (toutes les 5 minutes)
  useEffect(() => {
    if (!user || !token) return;

    const tokenCheckInterval = setInterval(async () => {
      const isValid = await checkTokenValidity();
      if (!isValid) {
        console.log('🔄 Token invalide détecté lors de la vérification périodique');
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(tokenCheckInterval);
  }, [user, token]);

  // Fonction de connexion
  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.login(credentials);
      setUser(response.user);
      setToken(response.token);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la connexion");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription
  const register = async (userData: RegisterData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authAPI.register(userData);
      setUser(response.user);
      setToken(response.token);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    setLoading(true);
    
    try {
      await authAPI.logout();
      setUser(null);
      setToken(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la déconnexion");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour les données utilisateur
  const updateUserData = (userData: User) => {
    setUser(userData);
  };

  // Fonction pour vérifier la validité du token
  const checkTokenValidity = async (): Promise<boolean> => {
    if (!token) {
      return false;
    }

    try {
      const validatedUser = await authAPI.getMe(token);
      setUser(validatedUser);
      return true;
    } catch (error: any) {
      console.log('❌ Token invalide, déconnexion automatique...');
      // Token invalide, déconnecter automatiquement
      await logout();
      return false;
    }
  };

  // Fonction pour nettoyer la session sans appel API (utile pour les tokens expirés)
  const clearSession = () => {
    setUser(null);
    setToken(null);
    setError(null);
    console.log('🧹 Session nettoyée localement');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, setError, updateUserData, checkTokenValidity, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
};