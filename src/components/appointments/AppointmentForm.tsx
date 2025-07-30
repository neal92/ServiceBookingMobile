import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Service, TimeSlot } from '../../types/index';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { formatDate } from '../../utils/date';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getServiceAvailability } from '../../api/services';
import { createAppointment } from '../../api/appointments';

interface AppointmentFormProps {
  service: Service;
  onSuccess?: (appointmentId: string) => void;
  onCancel?: () => void;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  service, 
  onSuccess,
  onCancel
}) => {
  const { user, token } = useAuth();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Charger les créneaux disponibles chaque fois que la date change
    loadAvailableSlots();
  }, [date]);

  const loadAvailableSlots = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const formattedDate = formatDate(date, 'YYYY-MM-DD');
      const response = await getServiceAvailability(service.id, formattedDate, token);
      setAvailableSlots(response.slots || []);
      setSelectedSlot(null); // Réinitialiser le créneau sélectionné
    } catch (error) {
      console.error('Error loading slots:', error);
      setError('Impossible de charger les créneaux disponibles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !token) {
      setError('Veuillez sélectionner un créneau horaire');
      return;
    }

    try {
      setIsLoading(true);
      const appointmentData = {
        serviceId: service.id,
        date: `${formatDate(date, 'YYYY-MM-DD')}T${selectedSlot.time}:00`,
        notes
      };

      const response = await createAppointment(appointmentData, token);
      
      if (onSuccess) {
        onSuccess(response.id);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur lors de la création du rendez-vous');
    } finally {
      setIsLoading(false);
    }
  };

  // Générer les 7 prochains jours
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(date.getDate() + i);
    return d;
  });

  // Regrouper les créneaux par période (matin, après-midi, soir)
  const slotPeriods = {
    Morning: availableSlots.filter(s => parseInt(s.time.split(':')[0]) < 12),
    Afternoon: availableSlots.filter(s => parseInt(s.time.split(':')[0]) >= 12 && parseInt(s.time.split(':')[0]) < 18),
    Evening: availableSlots.filter(s => parseInt(s.time.split(':')[0]) >= 18),
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Réserver {service?.name || 'Service'}</Text>
      <Text style={styles.price}>{service?.price ? `${service.price} €` : 'Prix non défini'}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {/* Sélecteur de jours horizontal */}
      <View style={styles.daysContainer}>
        <FlatList
          data={days}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={d => d.toISOString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.dayButton, item.toDateString() === date.toDateString() && styles.dayButtonSelected]}
              onPress={() => setDate(item)}
            >
              <Text style={styles.dayLabel}>{item.toLocaleDateString('fr-FR', { weekday: 'short' })}</Text>
              <Text style={styles.dayNumber}>{item.getDate()}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      {/* Créneaux horaires par période */}
      {Object.entries(slotPeriods).map(([period, slots]) => (
        slots.length > 0 && (
          <View key={period} style={styles.periodContainer}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodIcon}>{period === 'Morning' ? '🌅' : period === 'Afternoon' ? '🌞' : '🌙'}</Text>
              <Text style={styles.periodLabel}>{period === 'Morning' ? 'Matin' : period === 'Afternoon' ? 'Après-midi' : 'Soir'}</Text>
            </View>
            <View style={styles.slotContainer}>
              {slots.map(slot => (
                <TouchableOpacity
                  key={slot.id}
                  style={[styles.slotButton, selectedSlot?.id === slot.id && styles.slotButtonSelected]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.slotText, selectedSlot?.id === slot.id && styles.slotTextSelected]}>{slot.time}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )
      ))}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Notes (optionnel)</Text>
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Informations supplémentaires"
          multiline
          numberOfLines={4}
        />
      </View>
      <View style={styles.buttonGroup}>
        <Button 
          title="Annuler" 
          onPress={onCancel ?? (() => {})} 
          variant="outline"
          style={styles.cancelButton}
        />
        <Button 
          title={isLoading ? "Réservation..." : "Réserver"} 
          onPress={handleSubmit}
          disabled={isLoading || !selectedSlot}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  dayButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f2f4f8',
    marginRight: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#4F8EF7',
  },
  dayLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  periodContainer: {
    marginBottom: 16,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  periodIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  periodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4F8EF7',
  },
  slotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slotButton: {
    backgroundColor: '#f2f4f8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  slotButtonSelected: {
    backgroundColor: '#4F8EF7',
  },
  slotText: {
    color: '#222',
    fontWeight: '500',
    fontSize: 15,
  },
  slotTextSelected: {
    color: '#fff',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 2,
  },
});
