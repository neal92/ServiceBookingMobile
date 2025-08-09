import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Button } from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import authAPI from '../../api/auth';
import { getClientAppointments } from '../../api/appointments';
import { API_URL } from '../../config/api';
import SvgAvatar from '../../components/common/SvgAvatar';

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
    // Charger les informations utilisateur à jour seulement si nous avons un utilisateur et un token valides
    if (user && token) {
      // Utiliser l'avatar du contexte d'authentification s'il existe
      if (user.avatar && !userAvatar) {
        console.log('🖼️ Utilisation de l\'avatar du contexte:', user.avatar);
        const baseUrl = API_URL.replace('/api', '');
        
        let avatarUrl;
        if (user.avatar.startsWith('http')) {
          avatarUrl = user.avatar;
        } else if (user.avatar.startsWith('/uploads/')) {
          avatarUrl = `${baseUrl}${user.avatar}`;
        } else {
          avatarUrl = `${baseUrl}/uploads/${user.avatar}`;
        }
        
        console.log('🖼️ URL avatar finale:', avatarUrl);
        setUserAvatar(avatarUrl);
      }
      
      refreshUserData();
      loadAppointmentsCount();
    }
  }, [user, token]);

  const refreshUserData = async () => {
    if (!token || !user) {
      console.log('❌ Pas de token ou d\'utilisateur pour récupérer les données');
      return;
    }
    
    try {
      const userData = await authAPI.getMe(token);
      console.log('🧪 DEBUG userData avatar:', userData.avatar);
      
      if (userData.avatar) {
        // Construire l'URL complète de l'avatar
        let avatarUrl;
        
        if (userData.avatar.startsWith('http')) {
          avatarUrl = userData.avatar;
        } else {
          // Tester différents chemins possibles pour l'avatar
          const baseUrl = API_URL.replace('/api', '');
          
          // Essayer d'abord avec le chemin direct
          if (userData.avatar.startsWith('/uploads/')) {
            avatarUrl = `${baseUrl}${userData.avatar}`;
          } else {
            // Sinon, construire le chemin avec /uploads/
            avatarUrl = `${baseUrl}/uploads/${userData.avatar}`;
          }
        }
        
        console.log('🖼️ Avatar URL construite:', avatarUrl);
        setUserAvatar(avatarUrl);
      } else {
        console.log('❌ Pas d\'avatar trouvé pour l\'utilisateur');
        setUserAvatar(null);
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      
      // Si c'est une erreur de token expiré, ne pas afficher d'erreur car elle sera gérée par l'intercepteur
      if (error.response?.status === 401) {
        console.log('🔑 Token expiré détecté dans ProfileScreen, l\'intercepteur s\'en charge...');
        return;
      }
      
      // Pour d'autres erreurs, afficher un message approprié
      Alert.alert(
        'Erreur',
        'Impossible de récupérer vos informations. Veuillez vérifier votre connexion.'
      );
    }
  };

  const loadAppointmentsCount = async () => {
    if (!token || !user) {
      console.log('❌ Pas de token ou d\'utilisateur pour récupérer les rendez-vous');
      return;
    }
    
    try {
      setIsLoadingAppointments(true);
      // Passer l'email de l'utilisateur à l'API
      const appointments = await getClientAppointments(token, user.email);
      setAppointmentsCount((appointments || []).length);
    } catch (error: any) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
      setAppointmentsCount(0);
      
      // Si c'est une erreur de token expiré, ne pas afficher d'erreur car elle sera gérée par l'intercepteur
      if (error.response?.status === 401) {
        console.log('🔑 Token expiré détecté dans loadAppointmentsCount, l\'intercepteur s\'en charge...');
        return;
      }
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

  const handleAvatarError = (error: any) => {
    console.log('❌ Erreur chargement avatar SVG:', userAvatar);
    console.log('❌ Détails erreur SVG:', error?.nativeEvent || error);
    
    // L'erreur est maintenant gérée automatiquement par SvgAvatar
    // qui affichera le placeholder en cas d'erreur
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>ServiceBooking</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>Simplifiez votre gestion de rendez-vous</Text>
        </View>
      </View>

      {/* Espacement après header */}
      <View style={{ height: 16 }} />

      <ScrollView 
        style={[styles.content, isDarkMode && styles.contentDark]} 
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileSection, isDarkMode && styles.profileSectionDark]}>
          <SvgAvatar
            uri={userAvatar}
            size={80}
            isDarkMode={isDarkMode}
            style={styles.profileImage}
            onLoadStart={() => console.log('🔄 Début chargement avatar:', userAvatar)}
            onLoad={() => console.log('✅ Avatar SVG chargé avec succès:', userAvatar)}
            onError={handleAvatarError}
          />
          
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
              {(() => {
                return appointmentsCount > 0 && (
                  <Text style={styles.menuBadge}> ({appointmentsCount})</Text>
                );
              })()}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F8EF7',
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
  scrollContentContainer: {
    paddingBottom: 40, // Padding bottom pour éviter que le scroll cache les éléments
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
    justifyContent: 'center',
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
