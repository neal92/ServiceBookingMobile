import React, { useContext } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { Appointment } from '../../types/index';
import { AppointmentCard } from './AppointmentCard';
import { Loading } from '../common/Loading';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading: boolean;
  onAppointmentPress: (appointment: Appointment) => void;
  onCancelAppointment: (appointmentId: string) => void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  isLoading,
  onAppointmentPress,
  onCancelAppointment
}) => {
  const { isDarkMode } = useContext(ThemeContext);

  if (isLoading) {
    return <Loading />;
  }

  if (appointments.length === 0) {
    return (
      <View style={[styles.emptyContainer, isDarkMode && styles.emptyContainerDark]}>
        <View style={[styles.emptyIconContainer, isDarkMode && styles.emptyIconContainerDark]}>
          <Ionicons 
            name="calendar-outline" 
            size={64} 
            color={isDarkMode ? '#4B5563' : '#D1D5DB'} 
          />
        </View>
        <Text style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}>
          Aucun rendez-vous
        </Text>
        <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
          Vous n'avez pas encore de rendez-vous dans cette catégorie.
        </Text>
        <View style={styles.emptyHint}>
          <Ionicons 
            name="bulb-outline" 
            size={16} 
            color={isDarkMode ? '#60A5FA' : '#3498db'} 
          />
          <Text style={[styles.emptyHintText, isDarkMode && styles.emptyHintTextDark]}>
            Consultez la page Services pour réserver un nouveau rendez-vous
          </Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={appointments}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <AppointmentCard
          appointment={item}
          onPress={onAppointmentPress}
          onCancel={onCancelAppointment}
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyHintText: {
    fontSize: 12,
    color: '#3498db',
    marginLeft: 6,
    flex: 1,
    textAlign: 'center',
  },
  // Styles pour le mode sombre
  emptyContainerDark: {
    backgroundColor: '#111827',
  },
  emptyIconContainerDark: {
    backgroundColor: '#374151',
  },
  emptyTitleDark: {
    color: '#F9FAFB',
  },
  emptyTextDark: {
    color: '#9CA3AF',
  },
  emptyHintTextDark: {
    color: '#60A5FA',
  },
});
