import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, TouchableOpacity, FlatList, Animated, Dimensions } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AppointmentList } from '../../components/appointments/AppointmentList';
import { Appointment } from '../../types/index';
import { getUserAppointments, deleteAppointment } from '../../api/appointments';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const AppointmentsScreen: React.FC = () => {
  const { token } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Filtre par statut
  const [dateFilter, setDateFilter] = useState<'closest' | 'farthest'>('closest'); // Filtre par date
  const [showFilters, setShowFilters] = useState(false); // État pour afficher/cacher les filtres
  const [showSort, setShowSort] = useState(false); // État pour afficher/cacher le tri

  // Animations pour les onglets
  const tabAnimationValue = useRef(new Animated.Value(0)).current; // 0 = upcoming, 1 = past
  const scaleUpcoming = useRef(new Animated.Value(1)).current;
  const scalePast = useRef(new Animated.Value(1)).current;
  const filtersAnimationValue = useRef(new Animated.Value(0)).current; // Animation pour les filtres
  const sortAnimationValue = useRef(new Animated.Value(0)).current; // Animation pour le tri

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
      
      // Adapter les rendez-vous pour fournir un champ 'service' objet (prestation)
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
  
  // Fonction pour créer une date complète avec l'heure
  const getFullAppointmentDateTime = (appointment: Appointment) => {
    const aptDate = new Date(appointment.date);
    
    // Si il y a une heure spécifiée, l'ajouter à la date
    if (appointment.time) {
      const [hours, minutes] = appointment.time.split(':').map(Number);
      aptDate.setHours(hours, minutes, 0, 0);
    } else {
      // Si pas d'heure, considérer le rendez-vous en fin de journée (23h59)
      aptDate.setHours(23, 59, 59, 999);
    }
    
    return aptDate;
  };
  
  // Séparer d'abord par upcoming/past, puis appliquer le filtre de statut
  const allUpcomingAppointments = appointments.filter(apt => {
    const fullAptDateTime = getFullAppointmentDateTime(apt);
    return fullAptDateTime >= currentDate && apt.status !== 'cancelled';
  });
  
  const allPastAppointments = appointments.filter(apt => {
    const fullAptDateTime = getFullAppointmentDateTime(apt);
    return fullAptDateTime < currentDate || apt.status === 'cancelled';
  });
  
  // Fonction pour filtrer les rendez-vous par statut
  const filterAppointmentsByStatus = (appointments: Appointment[]) => {
    if (statusFilter === 'all') {
      return appointments;
    }
    return appointments.filter(apt => apt.status === statusFilter);
  };

  // Fonction pour trier les rendez-vous par date
  const sortAppointmentsByDate = (appointments: Appointment[]) => {
    return [...appointments].sort((a, b) => {
      const dateTimeA = getFullAppointmentDateTime(a).getTime();
      const dateTimeB = getFullAppointmentDateTime(b).getTime();
      
      if (dateFilter === 'closest') {
        return dateTimeA - dateTimeB; // Du plus proche au plus loin
      } else {
        return dateTimeB - dateTimeA; // Du plus loin au plus proche
      }
    });
  };
  
  const upcomingAppointments = sortAppointmentsByDate(filterAppointmentsByStatus(allUpcomingAppointments));
  const pastAppointments = sortAppointmentsByDate(filterAppointmentsByStatus(allPastAppointments));

  // Fonction pour obtenir le nombre de rendez-vous par statut
  const getStatusCount = (status: string, isUpcoming: boolean = true) => {
    const relevantAppointments = isUpcoming ? allUpcomingAppointments : allPastAppointments;
    
    if (status === 'all') {
      return relevantAppointments.length;
    }
    return relevantAppointments.filter(apt => apt.status === status).length;
  };

  // Fonctions d'animation pour les onglets
  const animateTabSwitch = (newTab: 'upcoming' | 'past') => {
    const targetValue = newTab === 'upcoming' ? 0 : 1;
    
    Animated.timing(tabAnimationValue, {
      toValue: targetValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const animateTabPress = (tab: 'upcoming' | 'past') => {
    const scaleValue = tab === 'upcoming' ? scaleUpcoming : scalePast;
    
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleTabPress = (tab: 'upcoming' | 'past') => {
    if (tab !== activeTab) {
      animateTabSwitch(tab);
      setActiveTab(tab);
    }
    animateTabPress(tab);
  };

  // Fonction pour afficher/cacher les filtres avec animation
  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 1;
    
    Animated.timing(filtersAnimationValue, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setShowFilters(!showFilters);
  };

  // Fonction pour afficher/cacher le tri avec animation
  const toggleSort = () => {
    const toValue = showSort ? 0 : 1;
    
    Animated.timing(sortAnimationValue, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setShowSort(!showSort);
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
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('upcoming')}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="calendar-outline" 
              size={16} 
              color={activeTab === 'upcoming' ? '#3498db' : '#6B7280'} 
              style={styles.tabIcon}
            />
            <Text 
              style={[
                styles.tabText,
                activeTab === 'upcoming' && styles.activeTabText
              ]}
            >
              À venir ({getStatusCount(statusFilter, true)})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.tab}
            onPress={() => handleTabPress('past')}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="time-outline" 
              size={16} 
              color={activeTab === 'past' ? '#3498db' : '#6B7280'} 
              style={styles.tabIcon}
            />
            <Text 
              style={[
                styles.tabText,
                activeTab === 'past' && styles.activeTabText
              ]}
            >
              Passés ({getStatusCount(statusFilter, false)})
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Boutons de filtres et tri - alignés à droite */}
        <View style={styles.actionButtonsContainerRight}>
          <TouchableOpacity 
            onPress={toggleFilters}
            style={[
              styles.filterToggleButton, 
              isDarkMode && styles.filterToggleButtonDark,
              (statusFilter !== 'all') && styles.filterToggleButtonActive
            ]}
          >
            <Ionicons 
              name={showFilters ? "close" : "filter"} 
              size={20} 
              color={
                (statusFilter !== 'all') 
                  ? "#fff" 
                  : (isDarkMode ? "#60A5FA" : "#3498db")
              } 
            />
            <Text style={[
              styles.filterToggleText, 
              isDarkMode && styles.filterToggleTextDark,
              (statusFilter !== 'all') && styles.filterToggleTextActive
            ]}>
              {showFilters ? "Fermer" : "Filtres"}
            </Text>
            {(statusFilter !== 'all') && (
              <View style={styles.filterIndicator}>
                <Text style={styles.filterIndicatorText}>•</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={toggleSort}
            style={[
              styles.sortToggleButton, 
              isDarkMode && styles.sortToggleButtonDark,
              (dateFilter !== 'closest') && styles.sortToggleButtonActive
            ]}
          >
            <Ionicons 
              name={showSort ? "close" : "swap-vertical"} 
              size={20} 
              color={
                (dateFilter !== 'closest') 
                  ? "#fff" 
                  : (isDarkMode ? "#60A5FA" : "#3498db")
              } 
            />
            <Text style={[
              styles.sortToggleText, 
              isDarkMode && styles.sortToggleTextDark,
              (dateFilter !== 'closest') && styles.sortToggleTextActive
            ]}>
              {showSort ? "Fermer" : "Tri"}
            </Text>
            {(dateFilter !== 'closest') && (
              <View style={styles.sortIndicator}>
                <Text style={styles.sortIndicatorText}>•</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Bouton Clear visible seulement si des filtres sont appliqués */}
          {(statusFilter !== 'all' || dateFilter !== 'closest') && (
            <TouchableOpacity 
              onPress={() => {
                setStatusFilter('all');
                setDateFilter('closest');
                setShowFilters(false);
                setShowSort(false);
              }}
              style={[styles.clearButton, isDarkMode && styles.clearButtonDark]}
            >
              <Ionicons 
                name="refresh" 
                size={18} 
                color={isDarkMode ? "#EF4444" : "#EF4444"} 
              />
              <Text style={[styles.clearButtonText, isDarkMode && styles.clearButtonTextDark]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Section des filtres par statut */}
      {showFilters && (
        <Animated.View 
          style={[
            styles.filtersSection, 
            isDarkMode && styles.filtersSectionDark,
            {
              opacity: filtersAnimationValue,
              maxHeight: filtersAnimationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 300], // Hauteur réduite sans le tri
              }),
            }
          ]}
        >
          <View style={styles.filtersHeader}>
            <Ionicons 
              name="filter-outline" 
              size={18} 
              color={isDarkMode ? "#60A5FA" : "#3498db"} 
            />
            <Text style={[styles.filtersTitle, isDarkMode && styles.filtersTitleDark]}>
              Filtres
            </Text>
          </View>
          
          {/* Filtre par statut */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, isDarkMode && styles.filterLabelDark]}>
              Par statut
            </Text>
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
        </Animated.View>
      )}

      {/* Section de tri */}
      {showSort && (
        <Animated.View 
          style={[
            styles.sortSection, 
            isDarkMode && styles.sortSectionDark,
            {
              opacity: sortAnimationValue,
              maxHeight: sortAnimationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 150], // Hauteur pour le tri uniquement
              }),
            }
          ]}
        >
          <View style={styles.sortHeader}>
            <Ionicons 
              name="swap-vertical-outline" 
              size={18} 
              color={isDarkMode ? "#60A5FA" : "#3498db"} 
            />
            <Text style={[styles.sortTitle, isDarkMode && styles.sortTitleDark]}>
              Tri par date
            </Text>
          </View>
          
          <View style={styles.dateFilterContainer}>
            <TouchableOpacity
              style={[
                styles.dateFilterButton,
                isDarkMode && styles.dateFilterButtonDark,
                dateFilter === 'closest' && styles.dateFilterButtonActive
              ]}
              onPress={() => setDateFilter('closest')}
            >
              <Ionicons 
                name="arrow-up-circle-outline" 
                size={16} 
                color={dateFilter === 'closest' ? '#10B981' : (isDarkMode ? '#9CA3AF' : '#666')} 
              />
              <Text 
                style={[
                  styles.dateFilterText,
                  isDarkMode && styles.dateFilterTextDark,
                  dateFilter === 'closest' && { color: '#10B981', fontWeight: '600' }
                ]}
              >
                Du plus proche
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.dateFilterButton,
                isDarkMode && styles.dateFilterButtonDark,
                dateFilter === 'farthest' && styles.dateFilterButtonActive
              ]}
              onPress={() => setDateFilter('farthest')}
            >
              <Ionicons 
                name="arrow-down-circle-outline" 
                size={16} 
                color={dateFilter === 'farthest' ? '#F59E0B' : (isDarkMode ? '#9CA3AF' : '#666')} 
              />
              <Text 
                style={[
                  styles.dateFilterText,
                  isDarkMode && styles.dateFilterTextDark,
                  dateFilter === 'farthest' && { color: '#F59E0B', fontWeight: '600' }
                ]}
              >
                Du plus loin
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      <ScrollView 
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabWrapper: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    fontWeight: '700',
    color: '#3498db',
    fontSize: 16,
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
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  tabDark: {
    backgroundColor: 'transparent',
  },
  activeTabDark: {
    // Style pour l'onglet actif en mode sombre si nécessaire
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
  // Nouveaux styles pour les filtres améliorés
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterLabelDark: {
    color: '#9CA3AF',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dateFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  dateFilterButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  dateFilterButtonActive: {
    borderWidth: 2,
    backgroundColor: '#f0f9ff',
  },
  dateFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 6,
  },
  dateFilterTextDark: {
    color: '#9CA3AF',
  },
  // Styles pour le bouton de filtres
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    alignSelf: 'flex-start',
  },
  filterToggleButtonDark: {
    backgroundColor: '#1e293b',
    borderColor: '#374151',
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3498db',
    marginLeft: 6,
  },
  filterToggleTextDark: {
    color: '#60A5FA',
  },
  // Styles pour les boutons d'actions
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 0,
    justifyContent: 'flex-start',
  },
  actionButtonsContainerRight: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 0,
    justifyContent: 'flex-end',
  },
  sortToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    alignSelf: 'flex-start',
  },
  sortToggleButtonDark: {
    backgroundColor: '#1e293b',
    borderColor: '#374151',
  },
  sortToggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3498db',
    marginLeft: 6,
  },
  sortToggleTextDark: {
    color: '#60A5FA',
  },
  // Styles pour la section de tri
  sortSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  sortSectionDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#374151',
  },
  sortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sortTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  sortTitleDark: {
    color: '#9CA3AF',
  },
  // Styles pour les états actifs et indicateurs
  filterToggleButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterToggleTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  sortToggleButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  sortToggleTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  filterIndicator: {
    marginLeft: 4,
  },
  filterIndicatorText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sortIndicator: {
    marginLeft: 4,
  },
  sortIndicatorText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Styles pour le bouton Clear
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearButtonDark: {
    backgroundColor: '#450a0a',
    borderColor: '#7f1d1d',
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 4,
  },
  clearButtonTextDark: {
    color: '#EF4444',
  },
});

export default AppointmentsScreen;
