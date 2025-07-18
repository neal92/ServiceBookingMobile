import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { HomeScreen, ProfileScreen, AppointmentsScreen, ServicesScreen } from '../screens/app';
import AuthNavigator from './AuthNavigator';
import { TabParamList } from '../types/navigation';

// Écran de messagerie temporaire (à remplacer par votre composant réel)
import { View, Text } from 'react-native';
import { LoginScreen } from '../screens/auth';
const MessagingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 18 }}>Messagerie</Text>
    <Text>Cette fonctionnalité sera bientôt disponible</Text>
  </View>
);

const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

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
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E86C1',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ title: 'Accueil' }} 
      />
      <Tab.Screen
        name="ServicesTab"
        component={ServicesScreen}
        options={{ title: 'Services' }}
      />
      <Tab.Screen
        name="MessagingTab"
        component={MessagingScreen}
        options={{ title: 'Messagerie' }}
      />
      
      {isAuthenticated ? (
        <>
          <Tab.Screen 
            name="AppointmentsTab" 
            component={AppointmentsScreen} 
            options={{ title: 'Rendez-vous' }} 
          />
          <Tab.Screen 
            name="ProfileTab" 
            component={ProfileScreen} 
            options={{ title: 'Profil' }} 
          />
        </>
      ) : (
        <Tab.Screen 
          name="AuthTab" 
          component={LoginScreen} 
          options={{ title: 'Connexion', headerShown: false }} 
        />
      )}
    </Tab.Navigator>
  );
};

export default TabNavigator;
