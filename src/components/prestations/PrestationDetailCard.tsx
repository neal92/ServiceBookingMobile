import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Service } from '../../types/index';
import { API_URL } from '../../config/api';

interface PrestationDetailCardProps {
  prestation: Service | null;
  visible: boolean;
  onClose: () => void;
  onBook: (prestation: Service) => void;
  isDarkMode?: boolean;
}

const PrestationDetailCard: React.FC<PrestationDetailCardProps> = ({
  prestation,
  visible,
  onClose,
  onBook,
  isDarkMode = false
}) => {
  if (!prestation) return null;

  // Fonction pour construire l'URL de l'image (même logique que ServicesScreen)
  const getServiceImageUrl = (service: Service): string | null => {
    if (service.image && service.image !== 'null' && service.image !== '') {
      // Utiliser la route API spécifique pour récupérer l'image par ID de service
      const imageUrl = `${API_URL}/services/${service.id}/image`;
      return imageUrl;
    }
    return null;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}` : `${hours}h`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        {/* Header */}
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons 
              name="close" 
              size={24} 
              color={isDarkMode ? '#E5E7EB' : '#374151'} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
            Détails de la prestation
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image de la prestation */}
          {getServiceImageUrl(prestation) ? (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: getServiceImageUrl(prestation)! }} 
                style={styles.prestationImage}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={styles.imageContainer}>
              <View style={[
                styles.prestationImage, 
                { 
                  backgroundColor: isDarkMode ? '#374151' : '#f0f0f0', 
                  justifyContent: 'center', 
                  alignItems: 'center' 
                }
              ]}>
                <Text style={{ fontSize: 32 }}>📷</Text>
              </View>
            </View>
          )}

          {/* Informations principales */}
          <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
            <Text style={[styles.prestationName, isDarkMode && styles.prestationNameDark]}>
              {prestation.name}
            </Text>
            
            <Text style={[styles.category, isDarkMode && styles.categoryDark]}>
              {prestation.category || 'Catégorie non définie'}
            </Text>

            {prestation.description && (
              <Text style={[styles.description, isDarkMode && styles.descriptionDark]}>
                {prestation.description}
              </Text>
            )}

            {/* Détails techniques */}
            <View style={styles.detailsContainer}>
              <View style={[styles.detailItem, isDarkMode && styles.detailItemDark]}>
                <Ionicons 
                  name="time-outline" 
                  size={20} 
                  color={isDarkMode ? '#60A5FA' : '#3498db'} 
                />
                <Text style={[styles.detailLabel, isDarkMode && styles.detailLabelDark]}>
                  Durée
                </Text>
                <Text style={[styles.detailValue, isDarkMode && styles.detailValueDark]}>
                  {formatDuration(prestation.duration)}
                </Text>
              </View>

              <View style={[styles.detailItem, isDarkMode && styles.detailItemDark]}>
                <Ionicons 
                  name="card-outline" 
                  size={20} 
                  color={isDarkMode ? '#60A5FA' : '#3498db'} 
                />
                <Text style={[styles.detailLabel, isDarkMode && styles.detailLabelDark]}>
                  Prix
                </Text>
                <Text style={[styles.detailValue, styles.priceValue, isDarkMode && styles.detailValueDark]}>
                  {prestation.price}€
                </Text>
              </View>
            </View>
          </View>

          {/* Informations supplémentaires */}
          <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              À savoir
            </Text>
            <View style={styles.infoList}>
              <View style={styles.infoListItem}>
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={16} 
                  color="#10B981" 
                />
                <Text style={[styles.infoListText, isDarkMode && styles.infoListTextDark]}>
                  Accompte de 10e une fois la reservation confirmée
                </Text>
              </View>
              <View style={styles.infoListItem}>
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={16} 
                  color="#10B981" 
                />
                <Text style={[styles.infoListText, isDarkMode && styles.infoListTextDark]}>
                  Matériel professionnel fourni
                </Text>
              </View>
              <View style={styles.infoListItem}>
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={16} 
                  color="#10B981" 
                />
                <Text style={[styles.infoListText, isDarkMode && styles.infoListTextDark]}>
                    Annulation gratuite jusqu'à 24h avant le rendez-vous   
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bouton de réservation */}
        <View style={[styles.footer, isDarkMode && styles.footerDark]}>
          <TouchableOpacity 
            style={[styles.bookButton, isDarkMode && styles.bookButtonDark]}
            onPress={() => onBook(prestation)}
          >
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.bookButtonText}>
              Réserver cette prestation
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  headerTitleDark: {
    color: '#E5E7EB',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  prestationImage: {
    width: '100%',
    height: 200,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoCardDark: {
    backgroundColor: '#1F2937',
  },
  prestationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  prestationNameDark: {
    color: '#E5E7EB',
  },
  category: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryDark: {
    color: '#9CA3AF',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  descriptionDark: {
    color: '#9CA3AF',
  },
  detailsContainer: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  detailItemDark: {
    backgroundColor: '#374151',
  },
  detailLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  detailLabelDark: {
    color: '#E5E7EB',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  detailValueDark: {
    color: '#E5E7EB',
  },
  priceValue: {
    color: '#10B981',
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: '#E5E7EB',
  },
  infoList: {
    gap: 8,
  },
  infoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoListText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  infoListTextDark: {
    color: '#9CA3AF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  footerDark: {
    backgroundColor: '#1F2937',
    borderTopColor: '#374151',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonDark: {
    backgroundColor: '#60A5FA',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrestationDetailCard;
