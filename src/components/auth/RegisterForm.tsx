import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface RegisterFormProps {
  onSuccess?: () => void;
  onLoginPress?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onLoginPress }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleRegister = async () => {
    // Validation de base
    if (!name || !email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      setError('');
      // Assuming 'name' contains the full name, split it into firstName and lastName
      const [firstName, ...rest] = name.trim().split(' ');
      const lastName = rest.join(' ') || undefined;
      await register({ firstName, lastName, email, password });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Une erreur est survenue lors de l\'inscription');
    }
  };

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <Input
        placeholder="Nom complet"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Input
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Input
        placeholder="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      <Button 
        title={"S'inscrire"} 
        onPress={handleRegister}
        disabled={false}
      />
      
      <TouchableOpacity style={styles.loginLink} onPress={onLoginPress}>
        <Text style={styles.loginLinkText}>Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginLink: {
    alignSelf: 'center',
    marginTop: 15,
  },
  loginLinkText: {
    color: '#3498db',
    fontSize: 14,
  },
});
