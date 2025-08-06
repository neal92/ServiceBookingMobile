import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getClientAppointments } from '../../api/appointments';
import { Appointment } from '../../types';
import { Loading } from '../../components/common/Loading';

interface AppointmentHistoryScreenProps {
  navigation: any;
}

const AppointmentHistoryScreen: React.FC<AppointmentHistoryScreenProps> = ({ navigation }) => {
  const { token } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      const data = await getClientAppointments(token);
      setAppointments(data);
    } catch (error: any) {
      console.error('Erreur chargement rendez-vous:', error);
      Alert.alert('Erreur', 'Impossible de charger vos rendez-vous');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return appointments.filter(apt => new Date(apt.date) >= now && apt.status !== 'cancelled');
      case 'past':
        return appointments.filter(apt => new Date(apt.date) < now && apt.status !== 'cancelled');
      case 'cancelled':
        return appointments.filter(apt => apt.status === 'cancelled');
      default:
        return appointments;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return 'Inconnu';
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const filteredAppointments = getFilteredAppointments();

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
          Historique des rendez-vous
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Espacement après header */}
      <View style={{ height: 16 }} />

      {/* Filtres */}
      <View style={[styles.filterContainer, isDarkMode && styles.filterContainerDark]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              isDarkMode && styles.filterButtonDark,
              filter === 'all' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterText,
              isDarkMode && styles.filterTextDark,
              filter === 'all' && styles.filterTextActive,
            ]}>
              Tous ({(appointments || []).length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              isDarkMode && styles.filterButtonDark,
              filter === 'upcoming' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('upcoming')}
          >
            <Text style={[
              styles.filterText,
              isDarkMode && styles.filterTextDark,
              filter === 'upcoming' && styles.filterTextActive,
            ]}>
              À venir ({(appointments || []).filter(apt => new Date(apt.date) >= new Date() && apt.status !== 'cancelled').length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              isDarkMode && styles.filterButtonDark,
              filter === 'past' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('past')}
          >
            <Text style={[
              styles.filterText,
              isDarkMode && styles.filterTextDark,
              filter === 'past' && styles.filterTextActive,
            ]}>
              Passés ({(appointments || []).filter(apt => new Date(apt.date) < new Date() && apt.status !== 'cancelled').length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              isDarkMode && styles.filterButtonDark,
              filter === 'cancelled' && styles.filterButtonActive,
            ]}
            onPress={() => setFilter('cancelled')}
          >
            <Text style={[
              styles.filterText,
              isDarkMode && styles.filterTextDark,
              filter === 'cancelled' && styles.filterTextActive,
            ]}>
              Annulés ({(appointments || []).filter(apt => apt.status === 'cancelled').length || 0})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Liste des rendez-vous */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="calendar-outline" 
              size={64} 
              color={isDarkMode ? "#374151" : "#D1D5DB"} 
            />
            <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
              Aucun rendez-vous trouvé
            </Text>
            <Text style={[styles.emptySubtext, isDarkMode && styles.emptySubtextDark]}>
              {filter === 'all' 
                ? "Vous n'avez pas encore de rendez-vous"
                : `Aucun rendez-vous ${filter === 'upcoming' ? 'à venir' : filter === 'past' ? 'passé' : 'annulé'}`
              }
            </Text>
          </View>
        ) : (
          filteredAppointments.map((appointment) => (
            <View
              key={appointment.id}
              style={[styles.appointmentCard, isDarkMode && styles.appointmentCardDark]}
            >
              <View style={styles.appointmentHeader}>
                <Text style={[styles.serviceName, isDarkMode && styles.serviceNameDark]}>
                  {appointment.service?.name || 'Service'}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(appointment.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {getStatusText(appointment.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Ionicons 
                    name="calendar-outline" 
                    size={16} 
                    color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
                  />
                  <Text style={[styles.detailText, isDarkMode && styles.detailTextDark]}>
                    {formatDate(appointment.date)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons 
                    name="time-outline" 
                    size={16} 
                    color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
                  />
                  <Text style={[styles.detailText, isDarkMode && styles.detailTextDark]}>
                    {appointment.time}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons 
                    name="pricetag-outline" 
                    size={16} 
                    color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
                  />
                  <Text style={[styles.detailText, isDarkMode && styles.detailTextDark]}>
                    {appointment.service?.price || 0}€
                  </Text>
                </View>

                {appointment.service?.duration && (
                  <View style={styles.detailRow}>
                    <Ionicons 
                      name="hourglass-outline" 
                      size={16} 
                      color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
                    />
                    <Text style={[styles.detailText, isDarkMode && styles.detailTextDark]}>
                      {appointment.service.duration} min
                    </Text>
                  </View>
                )}

                {appointment.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={[styles.notesLabel, isDarkMode && styles.notesLabelDark]}>
                      Notes :
                    </Text>
                    <Text style={[styles.notesText, isDarkMode && styles.notesTextDark]}>
                      {appointment.notes}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  appointmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  notesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },

  // Styles mode sombre
  containerDark: {
    backgroundColor: '#111827',
  },
  headerDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  headerTitleDark: {
    color: '#fff',
  },
  filterContainerDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  filterButtonDark: {
    backgroundColor: '#374151',
  },
  filterTextDark: {
    color: '#9CA3AF',
  },
  emptyTextDark: {
    color: '#fff',
  },
  emptySubtextDark: {
    color: '#9CA3AF',
  },
  appointmentCardDark: {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
  },
  serviceNameDark: {
    color: '#fff',
  },
  detailTextDark: {
    color: '#9CA3AF',
  },
  notesLabelDark: {
    color: '#E5E7EB',
  },
  notesTextDark: {
    color: '#9CA3AF',
  },
});

export default AppointmentHistoryScreen;
