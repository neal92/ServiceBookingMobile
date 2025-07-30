export const getNavigationTheme = (isDarkMode: boolean) => ({
  colors: {
    background: isDarkMode ? '#1F2937' : '#FFFFFF',
    border: isDarkMode ? '#374151' : '#E5E7EB',
    card: isDarkMode ? '#1F2937' : '#FFFFFF',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    primary: '#4F8EF7',
    notification: '#FF3B30',
  },
  dark: isDarkMode,
  barStyle: isDarkMode ? 'light-content' : 'dark-content',
});

import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { TextStyle } from 'react-native';

export const getTabNavigatorOptions = (isDarkMode: boolean): BottomTabNavigationOptions => ({
  tabBarStyle: {
    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
    borderTopColor: isDarkMode ? '#374151' : '#E5E7EB',
    borderTopWidth: 1,
    height: 60,
    paddingTop: 5,
    paddingBottom: 5,
    elevation: 0,
    shadowColor: 'transparent',
  },
  tabBarActiveTintColor: '#4F8EF7',
  tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : '#6B7280',
  headerStyle: {
    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
    borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB',
    borderBottomWidth: 1,
    elevation: 0,
    shadowColor: 'transparent',
  },
  headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 18,
    color: isDarkMode ? '#FFFFFF' : '#000000',
  },
});
