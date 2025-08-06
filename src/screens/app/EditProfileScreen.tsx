import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Button } from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import authAPI from '../../api/auth';
import { API_URL } from '../../config/api';

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

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const { user, token, updateUserData } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);

  // États pour les champs du formulaire
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [pseudo, setPseudo] = useState(user?.pseudo || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // États pour l'interface
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    // Charger l'avatar actuel si disponible
    if (user?.avatar) {
      // Construire l'URL complète de l'avatar
      const avatarUrl = user.avatar.startsWith('http') 
        ? user.avatar 
        : `${API_URL}/uploads/avatars/${user.avatar}`;
      setProfileImage(avatarUrl);
    }
  }, [user]);

  // Fonction pour choisir une image
  const pickImage = async () => {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à la galerie.');
        return;
      }

      // Ouvrir la galerie
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        await uploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Fonction pour uploader l'avatar
  const uploadAvatar = async (imageAsset: any) => {
    if (!token) return;

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      
      // Préparation du fichier pour FormData
      const imageUri = Platform.OS === 'ios' ? imageAsset.uri.replace('file://', '') : imageAsset.uri;
      const filename = imageAsset.fileName || `avatar_${Date.now()}.jpg`;
      const type = imageAsset.type || 'image/jpeg';
      
      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);

      const updatedUser = await authAPI.uploadAvatar(formData, token);
      updateUserData(updatedUser);
      
      Alert.alert('Succès', 'Photo de profil mise à jour avec succès');
    } catch (error: any) {
      console.error('Erreur upload avatar:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour la photo');
      // Revenir à l'image précédente en cas d'erreur
      if (user?.avatar) {
        const avatarUrl = user.avatar.startsWith('http') 
          ? user.avatar 
          : `${API_URL}/uploads/avatars/${user.avatar}`;
        setProfileImage(avatarUrl);
      } else {
        setProfileImage(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour sauvegarder le profil
  const saveProfile = async () => {
    if (!token) return;

    // Validation des champs
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires (prénom, nom, email)');
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse email valide');
      return;
    }

    try {
      setIsLoading(true);

      const profileData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        pseudo: pseudo.trim(),
        phone: phone.trim(),
      };

      const updatedUser = await authAPI.updateProfile(profileData, token);
      updateUserData(updatedUser);

      Alert.alert('Succès', 'Profil mis à jour avec succès', [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le profil');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour changer le mot de passe
  const changePassword = async () => {
    if (!token) return;

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setIsLoading(true);

      await authAPI.changePassword({
        currentPassword,
        newPassword,
      }, token);

      Alert.alert('Succès', 'Mot de passe changé avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      console.error('Erreur changement mot de passe:', error);
      Alert.alert('Erreur', error.message || 'Impossible de changer le mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
          Modifier le profil
        </Text>
        <TouchableOpacity onPress={saveProfile} disabled={isLoading}>
          <Text style={[styles.saveButton, isDarkMode && styles.saveButtonDark]}>
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Espacement après header */}
      <View style={{ height: 16 }} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section Photo de profil */}
        <View style={[styles.avatarSection, isDarkMode && styles.avatarSectionDark]}>
          <TouchableOpacity onPress={pickImage} disabled={isLoading}>
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image 
                  source={{ uri: profileImage }} 
                  style={styles.avatar}
                  onError={() => {
                    console.log('Erreur chargement image');
                    setProfileImage(null);
                  }}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, isDarkMode && styles.avatarPlaceholderDark]}>
                  <Ionicons name="person" size={40} color={isDarkMode ? "#9CA3AF" : "#666"} />
                </View>
              )}
              <View style={styles.avatarOverlay}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={20} color="#fff" />
                )}
              </View>
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarText, isDarkMode && styles.avatarTextDark]}>
            {isLoading ? 'Téléchargement...' : 'Touchez pour changer la photo'}
          </Text>
        </View>

        {/* Section Informations personnelles */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Informations personnelles
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark]}>
              Prénom <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input, 
                isDarkMode && styles.inputDark,
                !firstName.trim() && styles.inputError
              ]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Votre prénom"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark]}>
              Nom <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input, 
                isDarkMode && styles.inputDark,
                !lastName.trim() && styles.inputError
              ]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Votre nom"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark]}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input, 
                isDarkMode && styles.inputDark,
                !email.trim() && styles.inputError
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark]}>Pseudo</Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              value={pseudo}
              onChangeText={setPseudo}
              placeholder="Votre pseudo"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark]}>Téléphone</Text>
            <TextInput
              style={[styles.input, isDarkMode && styles.inputDark]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Votre numéro de téléphone"
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Section Mot de passe */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
          >
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              Changer le mot de passe
            </Text>
            <Ionicons
              name={showPasswordSection ? "chevron-up" : "chevron-down"}
              size={20}
              color={isDarkMode ? "#9CA3AF" : "#666"}
            />
          </TouchableOpacity>

          {showPasswordSection && (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark]}>
                  Mot de passe actuel <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, isDarkMode && styles.inputDark]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Mot de passe actuel"
                  placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark]}>
                  Nouveau mot de passe <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input, 
                    isDarkMode && styles.inputDark,
                    newPassword.length > 0 && newPassword.length < 6 && styles.inputError
                  ]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nouveau mot de passe (min. 6 caractères)"
                  placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
                  secureTextEntry
                  editable={!isLoading}
                />
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <Text style={styles.errorText}>
                    Le mot de passe doit contenir au moins 6 caractères
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, isDarkMode && styles.inputLabelDark]}>
                  Confirmer le mot de passe <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input, 
                    isDarkMode && styles.inputDark,
                    confirmPassword.length > 0 && newPassword !== confirmPassword && styles.inputError
                  ]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
                  secureTextEntry
                  editable={!isLoading}
                />
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <Text style={styles.errorText}>
                    Les mots de passe ne correspondent pas
                  </Text>
                )}
              </View>

              <Button
                title="Changer le mot de passe"
                onPress={changePassword}
                disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                style={styles.passwordButton}
              />
            </>
          )}
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3498db',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  passwordButton: {
    marginTop: 10,
  },
  required: {
    color: '#EF4444',
    fontSize: 14,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Styles mode sombre
  containerDark: {
    backgroundColor: '#111827',
  },
  headerDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  headerTitleDark: {
    color: '#fff',
  },
  saveButtonDark: {
    color: '#60A5FA',
  },
  avatarSectionDark: {
    backgroundColor: '#1F2937',
  },
  avatarPlaceholderDark: {
    backgroundColor: '#374151',
  },
  avatarTextDark: {
    color: '#9CA3AF',
  },
  sectionDark: {
    backgroundColor: '#1F2937',
  },
  sectionTitleDark: {
    color: '#fff',
  },
  inputLabelDark: {
    color: '#E5E7EB',
  },
  inputDark: {
    backgroundColor: '#111827',
    borderColor: '#374151',
    color: '#fff',
  },
});

export default EditProfileScreen;
