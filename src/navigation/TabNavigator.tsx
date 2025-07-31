import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Animated } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { HomeScreen, ProfileScreen, AppointmentsScreen, ServicesScreen, MessagingScreen } from '../screens/app';
import AuthNavigator from './AuthNavigator';
import { TabParamList } from '../types/navigation';
import { ThemeContext } from '../contexts/ThemeContext';
import TabBarIcon from '../components/navigation/TabBarIcon';

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  const { user } = useAuth();
  const { isDarkMode } = useContext(ThemeContext); // Removed themeOpacity temporarily
  const isAuthenticated = !!user;

  return (
    <View style={{ flex: 1 }}> {/* Changed from Animated.View to View */}
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            borderBottomColor: isDarkMode ? '#374151' : '#E5E7EB',
            borderBottomWidth: 1,
          },
          headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          // Animation de transition entre les onglets
          animationEnabled: true,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ServicesTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'AppointmentsTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'MessagingTab') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'AuthTab') {
            iconName = focused ? 'log-in' : 'log-in-outline';
          } else {
            iconName = 'help-outline';
          }

          let label = '';
          if (route.name === 'HomeTab') {
            label = 'Accueil';
          } else if (route.name === 'ServicesTab') {
            label = 'Services';
          } else if (route.name === 'AppointmentsTab') {
            label = 'RDV';
          } else if (route.name === 'MessagingTab') {
            label = 'Messages';
          } else if (route.name === 'ProfileTab') {
            label = 'Profil';
          } else if (route.name === 'AuthTab') {
            label = 'Connexion';
          }
          
          return (
            <TabBarIcon 
              iconName={iconName}
              focused={focused}
              color={color}
              label={label}
            />
          );
        },
        headerShown: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 1,
          marginBottom: 3,
          display: 'none',
        },
        tabBarStyle: {
          height: 80, // Augmenté de 70 à 80 pour les nouvelles icônes
          backgroundColor: isDarkMode ? '#1F2937' : '#fff',
          borderTopColor: isDarkMode ? '#374151' : '#e0e0e0',
          borderTopWidth: 1,
          paddingTop: 10, // Augmenté de 8 à 10
          paddingBottom: 10, // Augmenté de 8 à 10
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.12,
          shadowRadius: 5,
          position: 'absolute', // Assurez-vous qu'elle soit positionnée correctement
          bottom: 0, // Fixée en bas
        },
        tabBarItemStyle: {
          paddingVertical: 5, // Augmenté de 3 à 5
          marginBottom: 2, // Ajout d'une marge en bas
          // Animation douce sur les items
          borderRadius: 12,
          marginHorizontal: 2,
        },
        // Ajouter des transitions personnalisées
        tabBarActiveTintColor: isDarkMode ? '#60A5FA' : '#3498db',
        tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : '#666',
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ 
          title: 'Accueil',
        }} 
      />
      <Tab.Screen
        name="ServicesTab"
        component={ServicesScreen}
        options={{ 
          title: 'Services',
        }}
      />
      {isAuthenticated ? (
        <>
          <Tab.Screen
            name="AppointmentsTab"
            component={AppointmentsScreen}
            options={{
              title: 'Rendez-vous',
            }}
          />
          <Tab.Screen
            name="MessagingTab"
            component={MessagingScreen}
            options={{
              title: 'Messages',
            }}
          />
          <Tab.Screen
            name="ProfileTab"
            component={ProfileScreen}
            options={{
              title: 'Profil',
            }}
          />
        </>
      ) : (
        <Tab.Screen
          name="AuthTab"
          component={AuthNavigator}
          options={{
            title: 'Connexion',
            headerShown: false,
          }}
        />
      )}
    </Tab.Navigator>
    </View>
  );
};

export default TabNavigator;