import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, TouchableOpacity, FlatList } from 'react-native';
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
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Filtre par statut

  // Types de statuts disponibles
  const statusOptions = [
    { id: 'all', label: 'Tous', icon: 'list-outline' as const, color: '#666' },
    { id: 'pending', label: 'En attente', icon: 'time-outline' as const, color: '#F59E0B' },
    { id: 'confirmed', label: 'Confirmé', icon: 'checkmark-circle-outline' as const, color: '#10B981' },
    { id: 'cancelled', label: 'Annulé', icon: 'close-circle-outline' as const, color: '#EF4444' },
    { id: 'completed', label: 'Terminé', icon: 'checkmark-done-outline' as const, color: '#6366F1' }
  ];

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await getUserAppointments(token);
      console.log('📅 Données reçues de l\'API:', response.slice(0, 1)); // Debug: voir la structure des données
      
      // Adapter les rendez-vous pour fournir un champ 'service' objet
      const adapted = response.map((apt: any) => ({
        ...apt,
        // Préserver le champ time s'il existe
        time: apt.time || apt.appointmentTime || null,
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
      console.log('📅 Données adaptées:', adapted.slice(0, 1)); // Debug: voir les données adaptées
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
  
  // Séparer d'abord par upcoming/past, puis appliquer le filtre de statut
  const allUpcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate >= currentDate && apt.status !== 'cancelled';
  });
  
  const allPastAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate < currentDate || apt.status === 'cancelled';
  });
  
  // Fonction pour filtrer les rendez-vous par statut
  const filterAppointmentsByStatus = (appointments: Appointment[]) => {
    if (statusFilter === 'all') {
      return appointments;
    }
    return appointments.filter(apt => apt.status === statusFilter);
  };
  
  const upcomingAppointments = filterAppointmentsByStatus(allUpcomingAppointments);
  const pastAppointments = filterAppointmentsByStatus(allPastAppointments);

  // Fonction pour obtenir le nombre de rendez-vous par statut
  const getStatusCount = (status: string, isUpcoming: boolean = true) => {
    const relevantAppointments = isUpcoming ? allUpcomingAppointments : allPastAppointments;
    
    if (status === 'all') {
      return relevantAppointments.length;
    }
    return relevantAppointments.filter(apt => apt.status === status).length;
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>ServiceBooking</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>Simplifiez votre gestion de rendez-vous</Text>
        </View>
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
            À venir ({getStatusCount(statusFilter, true)})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab, 
            isDarkMode && styles.tabDark,
            activeTab === 'past' && styles.activeTab
          ]}
          onPress={() => setActiveTab('past')}
        >
          <Text 
            style={[
              styles.tabText,
              isDarkMode && styles.tabTextDark,
              activeTab === 'past' && styles.activeTabText
            ]}
          >
            Passés ({getStatusCount(statusFilter, false)})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section des filtres par statut */}
      <View style={[styles.filtersSection, isDarkMode && styles.filtersSectionDark]}>
        <View style={styles.filtersHeader}>
          <Ionicons 
            name="filter-outline" 
            size={18} 
            color={isDarkMode ? "#60A5FA" : "#3498db"} 
          />
          <Text style={[styles.filtersTitle, isDarkMode && styles.filtersTitleDark]}>
            Filtrer par statut
          </Text>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statusOptions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const count = getStatusCount(item.id, activeTab === 'upcoming');
            return (
              <TouchableOpacity
                style={[
                  styles.statusFilterButton,
                  isDarkMode && styles.statusFilterButtonDark,
                  statusFilter === item.id && styles.statusFilterButtonActive,
                  statusFilter === item.id && { borderColor: item.color }
                ]}
                onPress={() => setStatusFilter(item.id)}
              >
                <Ionicons 
                  name={item.icon} 
                  size={16} 
                  color={statusFilter === item.id ? item.color : (isDarkMode ? '#9CA3AF' : '#666')} 
                />
                <Text 
                  style={[
                    styles.statusFilterText,
                    isDarkMode && styles.statusFilterTextDark,
                    statusFilter === item.id && { color: item.color, fontWeight: '600' }
                  ]}
                >
                  {item.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.statusBadge, { backgroundColor: item.color }]}>
                    <Text style={styles.statusBadgeText}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.statusFiltersList}
        />
      </View>

      <View style={styles.listContainer}>
        {activeTab === 'upcoming' ? (
          <AppointmentList
            appointments={upcomingAppointments}
            isLoading={isLoading}
            onAppointmentPress={handleAppointmentPress}
            onCancelAppointment={handleDeleteAppointment}
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
    backgroundColor: '#f8f9fa', // Même couleur que le container
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F8EF7', // Couleur bleue pour ServiceBooking
  },
  titleSection: {
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
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
    backgroundColor: '#111827', // gray-900 - Même couleur que le container dark
  },
  titleDark: {
    color: '#60A5FA', // Bleu plus clair pour le mode sombre
  },
  subtitleDark: {
    color: '#9CA3AF', // gray-400
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
  // Styles pour les filtres de statut
  filtersSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  filtersSectionDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#374151',
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  filtersTitleDark: {
    color: '#9CA3AF',
  },
  statusFiltersList: {
    paddingHorizontal: 0,
  },
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    minHeight: 36,
  },
  statusFilterButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  statusFilterButtonActive: {
    borderWidth: 2,
    backgroundColor: '#f0f9ff',
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 6,
    marginRight: 6,
  },
  statusFilterTextDark: {
    color: '#9CA3AF',
  },
  statusBadge: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default AppointmentsScreen;
