import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AppointmentList } from '../../components/appointments/AppointmentList';
import { Appointment } from '../../types/index';
import { getUserAppointments, deleteAppointment } from '../../api/appointments';
import { Ionicons } from '@expo/vector-icons';

const AppointmentsScreen: React.FC = () => {
  const { token } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await getUserAppointments(token);
      // Adapter les rendez-vous pour fournir un champ 'service' objet
      const adapted = response.map((apt: any) => ({
        ...apt,
        service: {
          id: apt.serviceId?.toString() ?? '',
          name: apt.serviceName ?? '',
          price: Number(apt.price) ?? 0,
          duration: apt.duration ?? 0,
          description: '',
          category: '',
          imageUrl: '',
        },
      }));
      setAppointments(adapted);
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous:', error);
      Alert.alert('Erreur', 'Impossible de charger vos rendez-vous.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppointmentPress = (appointment: Appointment) => {
    // Naviguer vers les détails du rendez-vous
    console.log('Pressed appointment:' , appointment);
  };

  const handleCancelAppointment = (appointmentId: string) => {
    Alert.alert(
      'Annuler le rendez-vous',
      'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            
            try {
              await deleteAppointment(appointmentId, token);
              // Mettre à jour la liste des rendez-vous
              setAppointments(appointments.map(apt => 
                apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
              ));
              Alert.alert('Succès', 'Votre rendez-vous a été annulé.');
            } catch (error) {
              console.error('Erreur lors de l\'annulation du rendez-vous:', error);
              Alert.alert('Erreur', 'Impossible d\'annuler ce rendez-vous.');
            }
          },
        },
      ]
    );
  };

  // Ajout d'une fonction pour supprimer un rendez-vous définitivement
  const handleDeleteAppointment = (appointmentId: string) => {
    Alert.alert(
      'Supprimer le rendez-vous',
      'Êtes-vous sûr de vouloir supprimer ce rendez-vous définitivement ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await deleteAppointment(appointmentId, token);
              setAppointments(appointments.filter(apt => apt.id !== appointmentId));
              Alert.alert('Succès', 'Le rendez-vous a été supprimé.');
            } catch (error) {
              console.error('Erreur lors de la suppression du rendez-vous:', error);
              Alert.alert('Erreur', 'Impossible de supprimer ce rendez-vous.');
            }
          },
        },
      ]
    );
  };

  const currentDate = new Date();
  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate >= currentDate && apt.status !== 'cancelled';
  });
  
  const pastAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate < currentDate || apt.status === 'cancelled';
  });

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Mes rendez-vous</Text>
        <TouchableOpacity onPress={loadAppointments}>
          <Ionicons name="refresh" size={24} color={isDarkMode ? "#60A5FA" : "#3498db"} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabContainer, isDarkMode && styles.tabContainerDark]}>
        <TouchableOpacity
          style={[
            styles.tab, 
            isDarkMode && styles.tabDark,
            activeTab === 'upcoming' && styles.activeTab
          ]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text 
            style={[
              styles.tabText,
              isDarkMode && styles.tabTextDark,
              activeTab === 'upcoming' && styles.activeTabText
            ]}
          >
            À venir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'past' && styles.activeTabText
            ]}
          >
            Passés
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {activeTab === 'upcoming' ? (
          <AppointmentList
            appointments={upcomingAppointments}
            isLoading={isLoading}
            onAppointmentPress={handleAppointmentPress}
            onCancelAppointment={handleCancelAppointment}
          />
        ) : (
          <AppointmentList
            appointments={pastAppointments}
            isLoading={isLoading}
            onAppointmentPress={handleAppointmentPress}
            onCancelAppointment={handleDeleteAppointment}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    paddingVertical: 12,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#3498db',
  },
  listContainer: {
    flex: 1,
  },
  // Styles pour le mode sombre
  containerDark: {
    backgroundColor: '#111827', // gray-900
  },
  headerDark: {
    backgroundColor: '#1F2937', // gray-800
  },
  titleDark: {
    color: '#FFFFFF',
  },
  tabContainerDark: {
    backgroundColor: '#1F2937', // gray-800
    borderBottomColor: '#374151', // gray-700
  },
  tabDark: {
    borderBottomColor: 'transparent',
  },
  tabTextDark: {
    color: '#9CA3AF', // gray-400
  },
});

export default AppointmentsScreen;
