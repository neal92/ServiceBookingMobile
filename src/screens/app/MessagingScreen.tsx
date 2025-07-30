import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';

const MessagingScreen: React.FC = () => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.content, isDarkMode && styles.contentDark]}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Messagerie</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Cette fonctionnalité sera bientôt disponible
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Styles pour le mode sombre
  containerDark: {
    backgroundColor: '#111827', // gray-900
  },
  contentDark: {
    backgroundColor: '#111827', // gray-900
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitleDark: {
    color: '#9CA3AF', // gray-400
  },
});

export default MessagingScreen;
