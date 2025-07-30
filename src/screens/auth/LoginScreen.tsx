import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { login, error, loading } = useContext(AuthContext);
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

  const handleLogin = async () => {
    try {
      console.log('DEBUG login: email', email, 'password', password);
      await login({ email, password });
      // Afficher le user et le token après login
      const user = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      console.log('DEBUG user après login:', user);
      console.log('DEBUG token après login:', token);
      // Navigation après succès
      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      });
    } catch (err: any) {
      // Affichage détaillé de l'erreur dans la console
      if (err.response) {
        console.error('Login failed:', err.response.data);
      } else {
        console.error('Login failed:', err);
      }
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
          <Text style={[styles.headerText, isDarkMode && styles.headerTextDark]}>Connexion</Text>
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
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
          
          <Button
            mode="contained"
            onPress={handleLogin}
            style={[styles.button, isDarkMode && styles.buttonDark]}
            loading={loading}
            disabled={loading}
            buttonColor={isDarkMode ? '#60A5FA' : '#1a73e8'}
          >
            Se connecter
          </Button>
          
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, isDarkMode && styles.registerTextDark]}>Vous n'avez pas de compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, isDarkMode && styles.registerLinkDark]}>S'inscrire</Text>
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
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
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
  input: {
    marginBottom: 15,
    backgroundColor: '#ffffff',
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
    backgroundColor: '#1a73e8',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#666',
    marginRight: 5,
  },
  registerLink: {
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
  registerTextDark: {
    color: '#9CA3AF', // gray-400
  },
  registerLinkDark: {
    color: '#60A5FA', // blue-400
  },
});

export default LoginScreen;