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
        setUser(currentUser);
        setToken(currentToken);
      } catch (err) {
        console.error("Error loading user:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

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

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};