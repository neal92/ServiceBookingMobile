import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { HomeScreen, ProfileScreen, AppointmentsScreen, ServicesScreen } from '../screens/app';
import AuthNavigator from './AuthNavigator';
import { TabParamList } from '../types/navigation';
import TabBarIcon from '../components/navigation/TabBarIcon';

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

          // Utiliser notre composant personnalisé TabBarIcon
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
              iconName={iconName as any}
              focused={focused}
              color={color}
              label={label}
            />
          );
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#95a5a6',
        headerShown: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 1,
          marginBottom: 3,
          display: 'none', // On masque les labels par défaut car on utilise notre propre label dans TabBarIcon
        },
        tabBarStyle: {
          height: 60, // Hauteur optimale
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0', // Bordure légèrement plus visible
          borderTopWidth: 1,
          paddingTop: 5, // Remontée du contenu
          paddingBottom: 5,
          marginBottom: 10, // Remonte la TabBar de 10 pixels par rapport au bas de l'écran
          elevation: 10, // Ombre plus prononcée sur Android
          shadowColor: '#000', // Ombre sur iOS
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.12,
          shadowRadius: 5,
          position: 'absolute', // Assure que la barre reste visible
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 999, // S'assure que la tabbar reste au-dessus des autres éléments
        },
        tabBarItemStyle: {
          paddingVertical: 3, // Réduit pour mieux aligner
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ 
          title: 'Accueil',
          headerStyle: {
            backgroundColor: '#fff',
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }} 
      />
      <Tab.Screen
        name="ServicesTab"
        component={ServicesScreen}
        options={{ 
          title: 'Services',
          headerStyle: {
            backgroundColor: '#fff',
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />
      <Tab.Screen
        name="MessagingTab"
        component={MessagingScreen}
        options={{ 
          title: 'Messagerie',
          headerStyle: {
            backgroundColor: '#fff',
            shadowColor: 'transparent',
            elevation: 0,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />
      
      {isAuthenticated ? (
        <>
          <Tab.Screen 
            name="AppointmentsTab" 
            component={AppointmentsScreen} 
            options={{ 
              title: 'Rendez-vous',
              headerStyle: {
                backgroundColor: '#fff',
                shadowColor: 'transparent',
                elevation: 0,
              },
              headerTitleStyle: {
                fontWeight: '600',
                fontSize: 18,
              },
            }} 
          />
          <Tab.Screen 
            name="ProfileTab" 
            component={ProfileScreen} 
            options={{ 
              title: 'Profil',
              headerStyle: {
                backgroundColor: '#fff',
                shadowColor: 'transparent',
                elevation: 0,
              },
              headerTitleStyle: {
                fontWeight: '600',
                fontSize: 18,
              },
            }} 
          />
        </>
      ) : (
        <Tab.Screen 
          name="AuthTab" 
          component={LoginScreen} 
          options={{ 
            title: 'Connexion', 
            headerShown: false,
            headerStyle: {
              backgroundColor: '#fff',
              shadowColor: 'transparent',
              elevation: 0,
            }
          }} 
        />
      )}
    </Tab.Navigator>
  );
};

export default TabNavigator;
