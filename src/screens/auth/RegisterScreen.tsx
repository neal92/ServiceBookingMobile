import React, { useState, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { TextInput, Button, SegmentedButtons } from 'react-native-paper';
import { AuthContext } from '../../contexts/AuthContext';
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>ServiceBooking</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.headerText}>Créer un compte</Text>
          
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
            style={styles.segmentedButtons}
          />
          
          <TextInput
            label="Prénom"
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
          />
          
          <TextInput
            label="Nom (optionnel)"
            value={lastName}
            onChangeText={setLastName}
            style={styles.input}
          />

          <TextInput
            label="Pseudo"
            value={pseudo}
            onChangeText={setPseudo}
            style={styles.input}
            autoCapitalize="none"
          />
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
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
          />
          
          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            loading={loading}
            disabled={loading}
          >
            Créer mon compte
          </Button>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Vous avez déjà un compte ?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Se connecter</Text>
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
});

export default RegisterScreen;