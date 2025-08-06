import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Button } from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import authAPI from '../../api/auth';
import { getClientAppointments } from '../../api/appointments';
import { API_URL } from '../../config/api';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout, token } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [appointmentsCount, setAppointmentsCount] = useState<number>(0);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);

  useEffect(() => {
    // Charger les informations utilisateur à jour
    if (token) {
      refreshUserData();
      loadAppointmentsCount();
    }
  }, [token]);

  const refreshUserData = async () => {
    if (!token) return;
    
    try {
      const userData = await authAPI.getMe(token);
      if (userData.avatar) {
        // Construire l'URL complète de l'avatar
        const avatarUrl = userData.avatar.startsWith('http') 
          ? userData.avatar 
          : `${API_URL}/uploads/avatars/${userData.avatar}`;
        setUserAvatar(avatarUrl);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
    }
  };

  const loadAppointmentsCount = async () => {
    if (!token) return;
    
    try {
      setIsLoadingAppointments(true);
      const appointments = await getClientAppointments(token);
      setAppointmentsCount(appointments.length || 0);
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
      setAppointmentsCount(0);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion.');
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleAppointmentHistory = () => {
    navigation.navigate('AppointmentsTab');
  };

  const handleSettings = () => {
    Alert.alert('À venir', 'Les paramètres seront bientôt disponibles');
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Aide et Support', 
      'Pour toute question ou problème :\n\n' +
      '📧 Email: support@servicebooking.com\n' +
      '📞 Téléphone: +33 1 23 45 67 89\n' +
      '🌐 Site web: www.servicebooking.com\n\n' +
      'Nous sommes là pour vous aider !',
      [{ text: 'OK', style: 'default' }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>ServiceBooking</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>Votre profil</Text>
        </View>
        <TouchableOpacity onPress={handleSettings}>
          <Ionicons name="settings-outline" size={24} color={isDarkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.content, isDarkMode && styles.contentDark]} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileSection, isDarkMode && styles.profileSectionDark]}>
          {userAvatar || user?.avatar ? (
            <Image
              source={{ uri: userAvatar || user?.avatar }}
              style={styles.profileImage}
              onError={() => setUserAvatar(null)}
            />
          ) : (
            <View style={[styles.profileImage, styles.profileImagePlaceholder, isDarkMode && styles.profileImagePlaceholderDark]}>
              <Ionicons name="person" size={40} color={isDarkMode ? "#9CA3AF" : "#666"} />
            </View>
          )}
          
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, isDarkMode && styles.userNameDark]}>
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.firstName || user?.pseudo || 'Utilisateur'
              }
            </Text>
            <Text style={[styles.userEmail, isDarkMode && styles.userEmailDark]}>
              {user?.email || 'email@example.com'}
            </Text>
            {user?.pseudo && (
              <Text style={[styles.userPseudo, isDarkMode && styles.userPseudoDark]}>
                @{user.pseudo}
              </Text>
            )}
            {user?.phone && (
              <Text style={[styles.userPhone, isDarkMode && styles.userPhoneDark]}>
                📞 {user.phone}
              </Text>
            )}
          </View>
          
          {/* Statistiques rapides */}
          <View style={[styles.statsContainer, isDarkMode && styles.statsContainerDark]}>
            <View style={[styles.statItem, isDarkMode && styles.statItemDark]}>
              <Text style={[styles.statNumber, isDarkMode && styles.statNumberDark]}>
                {isLoadingAppointments ? '...' : appointmentsCount}
              </Text>
              <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>
                Rendez-vous
              </Text>
            </View>
            <View style={[styles.statItem, isDarkMode && styles.statItemDark]}>
              <Text style={[styles.statNumber, isDarkMode && styles.statNumberDark]}>
                {user?.role === 'admin' ? 'Admin' : 'Client'}
              </Text>
              <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>
                Statut
              </Text>
            </View>
          </View>
        </View>

        {/* Menu principal */}
        <View style={[styles.menuSection, isDarkMode && styles.menuSectionDark]}>
          <TouchableOpacity 
            style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
            onPress={handleEditProfile}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#e8f5e8' }]}>
              <Ionicons name="person-outline" size={24} color="#27AE60" />
            </View>
            <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>Modifier le profil</Text>
            <Ionicons name="chevron-forward" size={24} color={isDarkMode ? "#9CA3AF" : "#ccc"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
            onPress={handleAppointmentHistory}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#e8f4fd' }]}>
              <Ionicons name="calendar-outline" size={24} color="#3498db" />
            </View>
            <Text style={[styles.menuText, isDarkMode && styles.menuTextDark]}>
              Historique des rendez-vous
              {appointmentsCount > 0 && (
                <Text style={styles.menuBadge}> ({appointmentsCount})</Text>
              )}
            </Text>
            <Ionicons name="chevron-forward" size={24} color={isDarkMode ? "#9CA3AF" : "#ccc"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.menuItem, isDarkMode && styles.menuItemDark]}
            onPress={handleHelpSupport}
          >
            <View style={[styles.menuIconContainer, { backgroundColor: '#fef3e2' }]}>
              <Ionicons name="help-circle-outline" size={24} color="#f39c12" />
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
    backgroundColor: '#f8f9fa',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 16,
    padding: 20,
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileImagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userPseudo: {
    fontSize: 14,
    color: '#3498db',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 16,
    marginTop: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  menuText: {
    fontSize: 18,
    flex: 1,
    fontWeight: '500',
  },
  menuBadge: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: 'normal',
  },
  logoutContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },

  // Styles mode sombre
  containerDark: {
    backgroundColor: '#111827',
  },
  headerDark: {
    backgroundColor: '#111827',
  },
  titleDark: {
    color: '#60A5FA',
  },
  subtitleDark: {
    color: '#9CA3AF',
  },
  contentDark: {
    backgroundColor: '#111827',
  },
  profileSectionDark: {
    backgroundColor: '#1F2937',
  },
  profileImagePlaceholderDark: {
    backgroundColor: '#374151',
  },
  userNameDark: {
    color: '#FFFFFF',
  },
  userEmailDark: {
    color: '#9CA3AF',
  },
  userPseudoDark: {
    color: '#60A5FA',
  },
  userPhoneDark: {
    color: '#9CA3AF',
  },
  statsContainerDark: {
    borderTopColor: '#374151',
  },
  statItemDark: {
    // No specific dark styles needed
  },
  statNumberDark: {
    color: '#60A5FA',
  },
  statLabelDark: {
    color: '#9CA3AF',
  },
  menuSectionDark: {
    backgroundColor: '#1F2937',
  },
  menuItemDark: {
    borderBottomColor: '#374151',
  },
  menuTextDark: {
    color: '#FFFFFF',
  },
});

export default ProfileScreen;
