import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { Appointment } from '../../types/index';
import { AppointmentCard } from './AppointmentCard';
import { Loading } from '../common/Loading';

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
  if (isLoading) {
    return <Loading />;
  }

  if (appointments.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
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
});
