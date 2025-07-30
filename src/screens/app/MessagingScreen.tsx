import React, { useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';

const MessagingScreen: React.FC = () => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>ServiceBooking</Text>
          <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>Simplifiez votre gestion de rendez-vous</Text>
        </View>
      </View>
      <View style={[styles.content, isDarkMode && styles.contentDark]}>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Messagerie - Cette fonctionnalité sera bientôt disponible
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa', // Même couleur que le container
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F8EF7', // Couleur bleue pour ServiceBooking
  },
  titleSection: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
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
  headerDark: {
    backgroundColor: '#111827', // gray-900 - Même couleur que le container dark
  },
  contentDark: {
    backgroundColor: '#111827', // gray-900
  },
  titleDark: {
    color: '#60A5FA', // Bleu plus clair pour le mode sombre
  },
  headerSubtitleDark: {
    color: '#9CA3AF', // gray-400
  },
  subtitleDark: {
    color: '#9CA3AF', // gray-400
  },
});

export default MessagingScreen;
