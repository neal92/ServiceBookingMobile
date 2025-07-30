import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';

const RegisterScreen = ({ navigation }: any) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const [userType, setUserType] = useState<"client" | "professional">('client');
  const { register, error, loading } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);

  // Thème pour les TextInput
  const inputTheme = {
    colors: {
      primary: isDarkMode ? '#60A5FA' : '#1a73e8',
      background: isDarkMode ? '#374151' : '#fff',
      surface: isDarkMode ? '#374151' : '#fff',
      onSurface: isDarkMode ? '#FFFFFF' : '#000',
      onSurfaceVariant: isDarkMode ? '#9CA3AF' : '#666',
      placeholder: isDarkMode ? '#9CA3AF' : '#666',
      outline: isDarkMode ? '#4B5563' : '#ccc',
    }
  };

  const handleRegister = async () => {
    // Validation de base
    if (password !== confirmPassword) {
      // Vous pourriez utiliser une fonction setError dans votre contexte
      console.error("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const userData = {
        firstName,
        lastName,
        email,
        password,
        pseudo,
        userType,
        role: userType === 'professional' ? "admin" as "admin" : "user" as "user",
      };

      await register(userData);
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, isDarkMode && styles.containerDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>ServiceBooking</Text>
        </View>

        <View style={[styles.formContainer, isDarkMode && styles.formContainerDark]}>
          <Text style={[styles.headerText, isDarkMode && styles.headerTextDark]}>Créer un compte</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <SegmentedButtons
            value={userType}
            onValueChange={setUserType}
            buttons={[
              { value: 'client', label: 'Client' },
              { value: 'professional', label: 'Professionnel' },
            ]}
            style={[styles.segmentedButtons, isDarkMode && styles.segmentedButtonsDark]}
            theme={{
              colors: {
                primary: isDarkMode ? '#60A5FA' : '#1a73e8',
                surface: isDarkMode ? '#374151' : '#fff',
                onSurface: isDarkMode ? '#FFFFFF' : '#000',
                outline: isDarkMode ? '#4B5563' : '#ccc',
              }
            }}
          />
          
          <TextInput
            label="Prénom"
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
            theme={inputTheme}
          />
          
          <TextInput
            label="Nom (optionnel)"
            value={lastName}
            onChangeText={setLastName}
            style={styles.input}
            theme={inputTheme}
          />

          <TextInput
            label="Pseudo"
            value={pseudo}
            onChangeText={setPseudo}
            style={styles.input}
            autoCapitalize="none"
            theme={inputTheme}
          />
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            theme={inputTheme}
          />
          
          <TextInput
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            right={
              <TextInput.Icon 
                icon={secureTextEntry ? "eye" : "eye-off"} 
                onPress={() => setSecureTextEntry(!secureTextEntry)} 
              />
            }
            style={styles.input}
            theme={inputTheme}
          />
          
          <TextInput
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={confirmSecureTextEntry}
            right={
              <TextInput.Icon 
                icon={confirmSecureTextEntry ? "eye" : "eye-off"} 
                onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)} 
              />
            }
            style={styles.input}
            theme={inputTheme}
          />
          
          <Button
            mode="contained"
            onPress={handleRegister}
            style={[styles.button, isDarkMode && styles.buttonDark]}
            loading={loading}
            disabled={loading}
            buttonColor={isDarkMode ? '#60A5FA' : '#1a73e8'}
          >
            Créer mon compte
          </Button>
          
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, isDarkMode && styles.loginTextDark]}>Vous avez déjà un compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, isDarkMode && styles.loginLinkDark]}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a73e8',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  segmentedButtons: {
    marginBottom: 15,
  },
  segmentedButtonsDark: {
    backgroundColor: '#374151', // gray-700
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
    backgroundColor: '#1a73e8',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    marginRight: 5,
  },
  loginLink: {
    color: '#1a73e8',
    fontWeight: '700',
  },
  // Styles pour le mode sombre
  containerDark: {
    backgroundColor: '#111827', // gray-900
  },
  titleDark: {
    color: '#FFFFFF',
  },
  formContainerDark: {
    backgroundColor: '#1F2937', // gray-800
  },
  headerTextDark: {
    color: '#FFFFFF',
  },
  buttonDark: {
    backgroundColor: '#60A5FA', // blue-400
  },
  loginTextDark: {
    color: '#9CA3AF', // gray-400
  },
  loginLinkDark: {
    color: '#60A5FA', // blue-400
  },
});

export default RegisterScreen;