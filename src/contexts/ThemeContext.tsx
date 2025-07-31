import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated } from 'react-native';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  isDarkMode: boolean;
  themeOpacity: Animated.Value; // Pour l'animation de transition
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isDarkMode: false,
  themeOpacity: new Animated.Value(1),
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');
  const themeOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Charger le thème sauvegardé au démarrage
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme as ThemeType);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du thème:', error);
    }
  };

  const toggleTheme = async () => {
    // Animation de transition
    Animated.sequence([
      Animated.timing(themeOpacity, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true, // Changé à true pour les animations d'opacité
      }),
      Animated.timing(themeOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true, // Changé à true pour les animations d'opacité
      })
    ]).start();

    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du thème:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme,
      isDarkMode: theme === 'dark',
      themeOpacity
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
