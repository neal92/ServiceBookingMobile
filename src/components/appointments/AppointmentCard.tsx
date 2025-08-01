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
            <Text style={[styles.serviceName, isDarkMode && styles.serviceNameDark]} numberOfLines={1}>
              {service?.name || 'Service non défini'}
            </Text>
          </View>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: isDarkMode ? statusInfo.color + '20' : statusInfo.bgColor }
          ]}>
            <Ionicons 
              name={statusInfo.icon} 
              size={14} 
              color={statusInfo.color} 
              style={styles.statusIcon}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        {/* Informations de date et heure */}
        <View style={styles.dateTimeSection}>
          <View style={styles.dateTimeRow}>
            <Ionicons 
              name="calendar-outline" 
              size={16} 
              color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
            />
            <Text style={[styles.dateTime, isDarkMode && styles.dateTimeDark]}>
              {formatDateWithTime(date, time)}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Ionicons 
              name="card-outline" 
              size={16} 
              color={isDarkMode ? '#60A5FA' : '#3498db'} 
            />
            <Text style={[styles.price, isDarkMode && styles.priceDark]}>
              {service?.price ? `${service.price} €` : 'Prix non défini'}
            </Text>
          </View>
        </View>

        {/* Durée du service */}
        {service?.duration && (
          <View style={styles.durationSection}>
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={isDarkMode ? '#9CA3AF' : '#6B7280'} 
            />
            <Text style={[styles.duration, isDarkMode && styles.durationDark]}>
              Durée : {service.duration} min
            </Text>
          </View>
        )}

        {/* Bouton d'action */}
        {status === 'cancelled' || status === 'completed' ? (
          <TouchableOpacity 
            style={[styles.deleteButton, isDarkMode && styles.deleteButtonDark]}
            onPress={() => onCancel && onCancel(id)}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.cancelButton, isDarkMode && styles.cancelButtonDark]}
            onPress={() => onCancel && onCancel(id)}
          >
            <Ionicons name="close-outline" size={16} color="#EF4444" />
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  serviceIcon: {
    marginRight: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateTimeSection: {
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateTime: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3498db',
    marginLeft: 6,
  },
  durationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  duration: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  // Styles pour le mode sombre
  containerDark: {
    backgroundColor: '#1F2937',
  },
  serviceNameDark: {
    color: '#F9FAFB',
  },
  dateTimeDark: {
    color: '#9CA3AF',
  },
  priceDark: {
    color: '#60A5FA',
  },
  durationDark: {
    color: '#9CA3AF',
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
