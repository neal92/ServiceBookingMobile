import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Appointment } from '../../types/index';
import { formatDate, formatTime } from '../../utils/date';
import { ThemeContext } from '../../contexts/ThemeContext';

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
  const { id, service, date, status } = appointment;
  
  // Déterminer la couleur du statut
  const getStatusColor = () => {
    switch(status) {
      case 'confirmed': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'cancelled': return '#f44336';
      default: return '#9e9e9e';
    }
  };
  
  // Traduire le statut
  const getStatusText = () => {
    switch(status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulé';
      default: return 'Inconnu';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, isDarkMode && styles.containerDark]} 
      onPress={() => onPress && onPress(appointment)}
      disabled={status === 'cancelled'}
    >
      <View style={styles.content}>
        <Text style={[styles.serviceName, isDarkMode && styles.serviceNameDark]}>{service?.name || 'Service non défini'}</Text>
        <View style={styles.row}>
          <Text style={[styles.dateTime, isDarkMode && styles.dateTimeDark]}>{formatDate(date)} à {formatTime(date)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </View>
        <Text style={[styles.price, isDarkMode && styles.priceDark]}>{service?.price ? `${service.price} €` : 'Prix non défini'}</Text>
        {/* Affichage du bouton Annuler ou Supprimer selon le statut */}
        {status === 'cancelled' ? (
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: '#e74c3c' }, isDarkMode && styles.cancelButtonDark]}
            onPress={() => onCancel && onCancel(id)}
          >
            <Text style={[styles.cancelButtonText, { color: '#e74c3c' }]}>Supprimer</Text>
          </TouchableOpacity>
        ) : status === 'completed' ? (
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: '#e74c3c' }, isDarkMode && styles.cancelButtonDark]}
            onPress={() => onCancel && onCancel(id)}
          >
            <Text style={[styles.cancelButtonText, { color: '#e74c3c' }]}>Supprimer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.cancelButton, isDarkMode && styles.cancelButtonDark]}
            onPress={() => onCancel && onCancel(id)}
          >
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
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 14,
    color: '#555',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  cancelButton: {
    marginTop: 10,
    padding: 8,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e3e3e3',
  },
  cancelButtonText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: '500',
  },
  // Styles pour le mode sombre
  containerDark: {
    backgroundColor: '#1F2937', // gray-800
  },
  serviceNameDark: {
    color: '#FFFFFF',
  },
  dateTimeDark: {
    color: '#9CA3AF', // gray-400
  },
  priceDark: {
    color: '#60A5FA', // blue-400
  },
  cancelButtonDark: {
    backgroundColor: '#374151', // gray-700
    borderColor: '#4B5563', // gray-600
  },
});
