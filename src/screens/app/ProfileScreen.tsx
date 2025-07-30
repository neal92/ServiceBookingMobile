import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Button } from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>ServiceBooking</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>Simplifiez votre gestion de rendez-vous</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color={isDarkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profileSection, isDarkMode && styles.profileSectionDark]}>
          <Image
            source={require('../../../assets/icon.png')} // Remplacer par une image de profil
            style={styles.profileImage}
          />
          <Text style={[styles.userName, isDarkMode && styles.userNameDark]}>{user?.firstName || 'Utilisateur'}</Text>
          <Text style={[styles.userEmail, isDarkMode && styles.userEmailDark]}>{user?.email || 'email@example.com'}</Text>
        </View>

        <View style={[styles.menuSection, isDarkMode && styles.menuSectionDark]}>
          <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="person-outline" size={24} color="#3498db" />
            </View>
            <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>Modifier le profil</Text>
            <Ionicons name="chevron-forward" size={24} color={isDarkMode ? "#9CA3AF" : "#ccc"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="calendar-outline" size={24} color="#3498db" />
            </View>
            <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>Historique des rendez-vous</Text>
            <Ionicons name="chevron-forward" size={24} color={isDarkMode ? "#9CA3AF" : "#ccc"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="card-outline" size={24} color="#3498db" />
            </View>
            <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>Méthodes de paiement</Text>
            <Ionicons name="chevron-forward" size={24} color={isDarkMode ? "#9CA3AF" : "#ccc"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="notifications-outline" size={24} color="#3498db" />
            </View>
            <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>Notifications</Text>
            <Ionicons name="chevron-forward" size={24} color={isDarkMode ? "#9CA3AF" : "#ccc"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, isDarkMode && styles.menuItemDark]}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="help-circle-outline" size={24} color="#3498db" />
            </View>
            <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>Aide et support</Text>
            <Ionicons name="chevron-forward" size={24} color={isDarkMode ? "#9CA3AF" : "#ccc"} />
          </TouchableOpacity>
        </View>

        <View style={styles.logoutContainer}>
          <Button 
            title="Déconnexion" 
            onPress={handleLogout}
            variant="outline"
            style={{
              backgroundColor: 'transparent',
              borderColor: isDarkMode ? '#ef4444' : '#e74c3c',
            }}
            textStyle={{
              color: isDarkMode ? '#ef4444' : '#e74c3c',
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa', // Même couleur que le container
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F8EF7', // Couleur bleue pour ServiceBooking
  },
  titleSection: {
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  content: {
    paddingBottom: 100, // Augmenté de 90 à 100 pour éviter que la tabBar cache le contenu
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  menuSection: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20, // Augmenté de 16 à 20
    paddingHorizontal: 24, // Augmenté de 20 à 24
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 48, // Augmenté de 40 à 48
    height: 48, // Augmenté de 40 à 48
    borderRadius: 24, // Augmenté de 20 à 24
    backgroundColor: '#ecf5fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20, // Augmenté de 16 à 20
  },
  menuText: {
    fontSize: 18, // Augmenté de 16 à 18
    flex: 1,
    fontWeight: '500', // Ajout d'un poids de police plus important
  },
  logoutContainer: {
    marginTop: 40, // Augmenté de 30 à 40 pour plus d'espace
    paddingHorizontal: 16,
    marginBottom: 20, // Ajout d'une marge en bas
  },
  // Styles pour le mode sombre
  containerDark: {
    backgroundColor: '#111827', // gray-900
  },
  headerDark: {
    backgroundColor: '#111827', // gray-900 - Même couleur que le container dark
  },
  titleDark: {
    color: '#60A5FA', // Bleu plus clair pour le mode sombre
  },
  subtitleDark: {
    color: '#9CA3AF', // gray-400
  },
  contentDark: {
    backgroundColor: '#111827', // gray-900
  },
  profileSectionDark: {
    backgroundColor: '#1F2937', // gray-800
  },
  menuSectionDark: {
    backgroundColor: '#1F2937', // gray-800
  },
  userNameDark: {
    color: '#FFFFFF',
  },
  userEmailDark: {
    color: '#9CA3AF', // gray-400
  },
  menuItemDark: {
    backgroundColor: '#1F2937', // gray-800
    borderBottomColor: '#374151', // gray-700
  },
  menuTextDark: {
    color: '#FFFFFF',
  },
});

export default ProfileScreen;
