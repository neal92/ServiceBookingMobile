import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Réserver {service.name}</Text>
      <Text style={styles.price}>{service.price} €</Text>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Date</Text>
        <Button 
          title={formatDate(date)} 
          onPress={() => setShowDatePicker(true)}
          variant="outline"
        />
        
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Créneaux disponibles</Text>
        {isLoading ? (
          <Text>Chargement des créneaux...</Text>
        ) : availableSlots.length === 0 ? (
          <Text>Aucun créneau disponible pour cette date</Text>
        ) : (
          <View style={styles.slotContainer}>
            {availableSlots.map((slot) => (
              <Button
                key={slot.id}
                title={slot.time}
                variant={selectedSlot?.id === slot.id ? "primary" : "outline"}
                onPress={() => setSelectedSlot(slot)}
                style={styles.slotButton}
              />
            ))}
          </View>
        )}
      </View>

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
  slotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  slotButton: {
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
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
