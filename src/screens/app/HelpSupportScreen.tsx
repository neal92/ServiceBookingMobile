import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface HelpSupportScreenProps {
  navigation: any;
}

const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ navigation }) => {
  const { isDarkMode } = useContext(ThemeContext);

  const handleEmailSupport = () => {
    const email = 'support@servicebooking.com';
    const subject = 'Demande d\'aide - ServiceBooking Mobile';
    const body = 'Bonjour,\n\nJ\'ai besoin d\'aide concernant...\n\nMerci';
    
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email');
    });
  };

  const handlePhoneSupport = () => {
    const phoneNumber = 'tel:+33123456789';
    
    Linking.openURL(phoneNumber).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application téléphone');
    });
  };

  const handleWebsite = () => {
    const url = 'https://servicebooking.com';
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le navigateur');
    });
  };

  const handleAPIDoc = () => {
    const url = 'http://172.25.1.22:5000/api-docs';
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la documentation API');
    });
  };

  const faqItems = [
    {
      question: 'Comment réserver un service ?',
      answer: 'Allez dans l\'onglet "Services", sélectionnez le service souhaité, choisissez une date et un créneau horaire, puis confirmez votre réservation.',
    },
    {
      question: 'Comment modifier mon profil ?',
      answer: 'Dans l\'onglet "Profil", touchez "Modifier le profil" pour mettre à jour vos informations personnelles.',
    },
    {
      question: 'Comment annuler un rendez-vous ?',
      answer: 'Consultez vos rendez-vous dans l\'onglet "Rendez-vous" et sélectionnez celui que vous souhaitez annuler.',
    },
    {
      question: 'Comment changer mon mot de passe ?',
      answer: 'Dans "Modifier le profil", dépliez la section "Changer le mot de passe" et suivez les instructions.',
    },
    {
      question: 'L\'application ne se connecte pas au serveur',
      answer: 'Vérifiez votre connexion internet et utilisez le bouton de test de connectivité dans l\'en-tête des écrans.',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
          Aide et Support
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Espacement après header */}
      <View style={{ height: 16 }} />

      <ScrollView style={styles.content}>
        {/* Section Contact */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Nous contacter
          </Text>

          <TouchableOpacity
            style={[styles.contactItem, isDarkMode && styles.contactItemDark]}
            onPress={handleEmailSupport}
          >
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={24} color="#3498db" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, isDarkMode && styles.contactTitleDark]}>
                Email Support
              </Text>
              <Text style={[styles.contactSubtitle, isDarkMode && styles.contactSubtitleDark]}>
                support@servicebooking.com
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#9CA3AF" : "#ccc"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactItem, isDarkMode && styles.contactItemDark]}
            onPress={handlePhoneSupport}
          >
            <View style={styles.contactIcon}>
              <Ionicons name="call-outline" size={24} color="#3498db" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, isDarkMode && styles.contactTitleDark]}>
                Support Téléphonique
              </Text>
              <Text style={[styles.contactSubtitle, isDarkMode && styles.contactSubtitleDark]}>
                +33 1 23 45 67 89
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#9CA3AF" : "#ccc"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactItem, isDarkMode && styles.contactItemDark]}
            onPress={handleWebsite}
          >
            <View style={styles.contactIcon}>
              <Ionicons name="globe-outline" size={24} color="#3498db" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, isDarkMode && styles.contactTitleDark]}>
                Site Web
              </Text>
              <Text style={[styles.contactSubtitle, isDarkMode && styles.contactSubtitleDark]}>
                servicebooking.com
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#9CA3AF" : "#ccc"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactItem, isDarkMode && styles.contactItemDark]}
            onPress={handleAPIDoc}
          >
            <View style={styles.contactIcon}>
              <Ionicons name="code-outline" size={24} color="#3498db" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, isDarkMode && styles.contactTitleDark]}>
                Documentation API
              </Text>
              <Text style={[styles.contactSubtitle, isDarkMode && styles.contactSubtitleDark]}>
                Swagger Documentation
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#9CA3AF" : "#ccc"} />
          </TouchableOpacity>
        </View>

        {/* Section FAQ */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Questions Fréquentes
          </Text>

          {faqItems.map((item, index) => (
            <View key={index} style={[styles.faqItem, isDarkMode && styles.faqItemDark]}>
              <Text style={[styles.faqQuestion, isDarkMode && styles.faqQuestionDark]}>
                {item.question}
              </Text>
              <Text style={[styles.faqAnswer, isDarkMode && styles.faqAnswerDark]}>
                {item.answer}
              </Text>
            </View>
          ))}
        </View>

        {/* Section Informations */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Informations de l'application
          </Text>

          <View style={styles.infoGrid}>
            <View style={[styles.infoItem, isDarkMode && styles.infoItemDark]}>
              <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Version</Text>
              <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>1.0.0</Text>
            </View>

            <View style={[styles.infoItem, isDarkMode && styles.infoItemDark]}>
              <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Build</Text>
              <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>2025.01</Text>
            </View>

            <View style={[styles.infoItem, isDarkMode && styles.infoItemDark]}>
              <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Platform</Text>
              <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>React Native</Text>
            </View>

            <View style={[styles.infoItem, isDarkMode && styles.infoItemDark]}>
              <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>Framework</Text>
              <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>Expo</Text>
            </View>
          </View>
        </View>

        {/* Section Ressources */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Ressources Utiles
          </Text>

          <View style={styles.resourcesList}>
            <Text style={[styles.resourceItem, isDarkMode && styles.resourceItemDark]}>
              • Guide d'utilisation de l'application
            </Text>
            <Text style={[styles.resourceItem, isDarkMode && styles.resourceItemDark]}>
              • Conditions générales d'utilisation
            </Text>
            <Text style={[styles.resourceItem, isDarkMode && styles.resourceItemDark]}>
              • Politique de confidentialité
            </Text>
            <Text style={[styles.resourceItem, isDarkMode && styles.resourceItemDark]}>
              • Centre d'aide en ligne
            </Text>
          </View>
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecf5fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resourcesList: {
    gap: 12,
  },
  resourceItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  sectionDark: {
    backgroundColor: '#1F2937',
  },
  sectionTitleDark: {
    color: '#fff',
  },
  contactItemDark: {
    borderBottomColor: '#374151',
  },
  contactTitleDark: {
    color: '#fff',
  },
  contactSubtitleDark: {
    color: '#9CA3AF',
  },
  faqItemDark: {
    borderBottomColor: '#374151',
  },
  faqQuestionDark: {
    color: '#fff',
  },
  faqAnswerDark: {
    color: '#9CA3AF',
  },
  infoItemDark: {
    backgroundColor: '#111827',
  },
  infoLabelDark: {
    color: '#9CA3AF',
  },
  infoValueDark: {
    color: '#fff',
  },
  resourceItemDark: {
    color: '#9CA3AF',
  },
});

export default HelpSupportScreen;
