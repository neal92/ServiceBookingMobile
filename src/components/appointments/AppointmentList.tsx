import React, { useContext } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { Appointment } from '../../types/index';
import { AppointmentCard } from './AppointmentCard';
import { Loading } from '../common/Loading';
import { ThemeContext } from '../../contexts/ThemeContext';

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
        <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
          Vous n'avez pas encore de rendez-vous.
        </Text>
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
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Styles pour le mode sombre
  emptyContainerDark: {
    backgroundColor: '#111827', // gray-900
  },
  emptyTextDark: {
    color: '#9CA3AF', // gray-400
  },
});
