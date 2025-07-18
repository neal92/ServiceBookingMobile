import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface TimeSlotPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dateTime: string) => void;
  serviceDuration: number; // en minutes
}

type Slot = { label: string; value: string; period: string };

const getTimeSlots = (duration: number): Slot[] => {
  const slots: Slot[] = [];
  const start = 8; // 8h
  const end = 20; // 20h
  for (let h = start; h < end; h += duration / 60) {
    const hour = Math.floor(h);
    const min = Math.round((h - hour) * 60);
    const date = new Date();
    date.setHours(hour, min, 0, 0);
    let period = '';
    if (hour < 12) period = 'Matin';
    else if (hour < 18) period = 'Après-midi';
    else period = 'Soirée';
    slots.push({
      label: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
      value: date.toISOString(),
      period,
    });
  }
  return slots;
};

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ visible, onClose, onSelect, serviceDuration }) => {
  const slots = getTimeSlots(serviceDuration);
  const periods = [
    { label: 'Matin', icon: '🌅' },
    { label: 'Après-midi', icon: '🌞' },
    { label: 'Soirée', icon: '🌙' },
  ];
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Choisissez un créneau</Text>
          <ScrollView>
            {periods.map(period => (
              <View key={period.label} style={styles.periodSection}>
                <View style={styles.periodHeader}>
                  <Text style={styles.periodIcon}>{period.icon}</Text>
                  <Text style={styles.periodLabel}>{period.label}</Text>
                </View>
                <View style={styles.slotContainer}>
                  {slots.filter(s => s.period === period.label).map(slot => (
                    <TouchableOpacity
                      key={slot.value}
                      style={styles.slotButton}
                      onPress={() => onSelect(slot.value)}
                    >
                      <Text style={styles.slotText}>{slot.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '85%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  periodSection: {
    marginBottom: 18,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  slotText: {
    color: '#222',
    fontWeight: '500',
    fontSize: 15,
  },
  closeBtn: {
    marginTop: 16,
    alignSelf: 'center',
  },
  closeText: {
    color: '#d32f2f',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
