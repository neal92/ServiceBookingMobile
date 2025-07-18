import React, { useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { AuthContext } from '../../contexts/AuthContext';
import { getUserAppointments } from '../../api/appointments';
import { Appointment } from '../../types/index';
import { AppointmentList } from '../../components/appointments/AppointmentList';

const HomeScreen = ({ navigation }: any) => {
  const { user, token } = useContext(AuthContext);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [selectedTime, setSelectedTime] = React.useState('09:00');
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchAppointments = async () => {
      if (user && token) {
        setIsLoading(true);
        try {
          const data = await getUserAppointments(token);
          setAppointments(data);
        } catch (e) {
          setAppointments([]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchAppointments();
  }, [user, token]);

  // Générer les 7 prochains jours
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(selectedDate.getDate() - selectedDate.getDay() + i + 1); // Commence lundi
    return d;
  });

  // Créneaux horaires exemple (matin)
  const morningSlots = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];

  // Filtrer les rendez-vous du jour sélectionné
  const appointmentsOfDay = appointments.filter(a => {
    const appDate = new Date(a.date);
    return appDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>
          {user ? `Bienvenue ${user.firstName}!` : 'Bienvenue'}
        </Text>
      </View>
      {/* Card pour le planning du jour et les rendez-vous */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>
            <Text style={{fontSize:18, marginRight:6}}>📅</Text>Agenda du Jour
          </Text>
          <FlatList
            data={days}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={d => d.toDateString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.dayButton, item.toDateString() === selectedDate.toDateString() && styles.dayButtonSelected]}
                onPress={() => setSelectedDate(item)}
              >
                <Text style={styles.dayLabel}>{item.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                <Text style={styles.dayNumber}>{item.getDate()}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.daysContainer}
          />
          {/* Affichage des rendez-vous du jour sélectionné */}
          {!user ? (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <Text style={{ fontSize: 16, color: '#d32f2f', marginBottom: 12, textAlign: 'center' }}>
                Veuillez vous connecter afin de voir vos rendez-vous
              </Text>
              <Button
                mode="contained"
                style={styles.button}
                onPress={() => navigation.navigate('AuthTab' as never)}
              >
                Se connecter
              </Button>
            </View>
          ) : (
            <View style={{ marginTop: 16 }}>
              <AppointmentList
                appointments={appointmentsOfDay}
                isLoading={isLoading}
                onAppointmentPress={() => {}}
                onCancelAppointment={() => {}}
              />
              {appointmentsOfDay.length === 0 && !isLoading && (
                <Text style={{ textAlign: 'center', color: '#888', fontSize: 15, marginTop: 8 }}>
                  Aucun rendez-vous ce jour
                </Text>
              )}
              <Button
                mode="contained"
                style={[styles.button, { alignSelf: 'center', marginTop: 12 }]}
                onPress={() => navigation.navigate('ServicesTab')}
              >
                Prendre un rendez-vous
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a73e8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1a73e8',
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoutButton: {
    marginTop: 20,
    borderColor: '#d32f2f',
    borderWidth: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  daysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f2f4f8',
    marginRight: 8,
    minWidth: 44,
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
  cardSchedule: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
});

export default HomeScreen;