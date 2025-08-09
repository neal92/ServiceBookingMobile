import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Appointment } from '../../types/index';
import { formatDateWithTime } from '../../utils/date';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: (appointment: Appointment) => void;
  onCancel?: (appointmentId: string) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  onPress, 
  onCancel 
}) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { id, service, date, time, status } = appointment;
  
  // Déterminer la couleur et l'icône du statut
  const getStatusInfo = () => {
    switch(status) {
      case 'confirmed': 
        return { 
          color: '#10B981', 
          icon: 'checkmark-circle' as const,
          bgColor: '#ECFDF5',
          text: 'Confirmé'
        };
      case 'pending': 
        return { 
          color: '#F59E0B', 
          icon: 'time' as const,
          bgColor: '#FFFBEB',
          text: 'En attente'
        };
      case 'cancelled': 
        return { 
          color: '#EF4444', 
          icon: 'close-circle' as const,
          bgColor: '#FEF2F2',
          text: 'Annulé'
        };
      case 'completed': 
        return { 
          color: '#8B5CF6', 
          icon: 'checkmark-done-circle' as const,
          bgColor: '#F3E8FF',
          text: 'Terminé'
        };
      default: 
        return { 
          color: '#6B7280', 
          icon: 'help-circle' as const,
          bgColor: '#F9FAFB',
          text: 'Inconnu'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity 
      style={[styles.container, isDarkMode && styles.containerDark]} 
      onPress={() => onPress && onPress(appointment)}
      disabled={status === 'cancelled'}
    >
      <View style={styles.content}>
        {/* En-tête avec titre et statut */}
        <View style={styles.header}>
          <View style={styles.serviceSection}>
            <Text style={[styles.serviceName, isDarkMode && styles.serviceNameDark]} numberOfLines={2}>
              {service?.name || 'Service non défini'}
            </Text>
            {service?.description && (
              <Text style={[
                { fontSize: 14, color: isDarkMode ? '#9CA3AF' : '#6B7280', marginTop: 2 }
              ]} numberOfLines={1}>
                {service.description}
              </Text>
            )}
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: isDarkMode ? statusInfo.color + '20' : statusInfo.bgColor }
          ]}>
            <Ionicons 
              name={statusInfo.icon} 
              size={16} 
              color={statusInfo.color} 
              style={styles.statusIcon}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        {/* Informations de date et heure */}
        <View style={[
          styles.dateTimeSection,
          isDarkMode && { backgroundColor: '#374151', borderLeftColor: '#60A5FA' }
        ]}>
          <View style={styles.dateTimeRow}>
            <Ionicons 
              name="calendar-outline" 
              size={18} 
              color={isDarkMode ? '#60A5FA' : '#3498db'} 
            />
            <Text style={[styles.dateTime, isDarkMode && styles.dateTimeDark]}>
              {formatDateWithTime(date, time)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Ionicons 
              name="card-outline" 
              size={18} 
              color={isDarkMode ? '#34D399' : '#10B981'} 
            />
            <Text style={[styles.price, isDarkMode && styles.priceDark]}>
              {service?.price ? `${String(service.price)} €` : 'Prix non défini'}
            </Text>
          </View>
        </View>

        {/* Durée du service */}
        {(() => {
          return service?.duration && (
            <View style={[
              styles.durationSection,
              isDarkMode && { backgroundColor: '#1E3A8A' }
            ]}>
              <Ionicons 
                name="time-outline" 
                size={16} 
                color={isDarkMode ? '#93C5FD' : '#1E40AF'} 
              />
              <Text style={[styles.duration, isDarkMode && styles.durationDark]}>
                Durée : {String(service.duration || 0)} min
              </Text>
            </View>
          );
        })()}

        {/* Bouton d'action */}
        {(() => {
          if (status === 'cancelled' || status === 'completed') {
            return (
              <TouchableOpacity 
                style={[styles.deleteButton, isDarkMode && styles.deleteButtonDark]}
                onPress={() => onCancel && onCancel(id)}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.deleteButtonText}>Supprimer</Text>
              </TouchableOpacity>
            );
          } else {
            return (
              <TouchableOpacity 
                style={[styles.cancelButton, isDarkMode && styles.cancelButtonDark]}
                onPress={() => onCancel && onCancel(id)}
              >
                <Ionicons name="close-outline" size={16} color="#EF4444" />
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            );
          }
        })()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceSection: {
    flex: 1,
    marginRight: 16,
  },
  serviceIcon: {
    marginRight: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    justifyContent: 'center',
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateTimeSection: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 8,
  },
  durationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginLeft: 6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  // Styles pour le mode sombre
  containerDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  serviceNameDark: {
    color: '#F9FAFB',
  },
  dateTimeDark: {
    color: '#F9FAFB',
  },
  priceDark: {
    color: '#34D399',
  },
  durationDark: {
    color: '#93C5FD',
  },
  cancelButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  deleteButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
});
