import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, TextInput, Alert, Modal, ScrollView, Animated } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Service, Appointment, CreateAppointmentRequest } from '../../types/index';
import { getAllServices, getAllCategories } from '../../api/services';
import { createAppointment, getAvailableTimeSlots, checkTimeSlotAvailability, getUserAppointments } from '../../api/appointments';
import { Loading } from '../../components/common/Loading';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { testAndShowAPIConnection } from '../../utils/networkUtils';
import { API_URL } from '../../config/api';
import PrestationDetailCard from '../../components/prestations/PrestationDetailCard';

const ServicesScreen: React.FC = () => {
  // --- Hooks et fonctions calendrier HomeScreen ---
  const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  function getMonthYearLabel(date: Date) {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  function isSameDay(a: Date, b: Date) {
    return (
      a && b &&
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  }

  // Removed duplicate isToday function to fix duplicate identifier error

  function isPastDay(date: Date) {
    const today = new Date();
    today.setHours(0,0,0,0);
    return date < today;
  }

  function goToPreviousMonth() {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }

  function goToNextMonth() {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }

  function getMonthGrid(monthDate: Date) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const emptyStartDays = Array.from({ length: firstDayOfWeek }, () => null);
    const monthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      monthDays.push(new Date(year, month, i));
    }
    const totalDaysAdded = firstDayOfWeek + daysInMonth;
    const remainingDays = totalDaysAdded % 7;
    const emptyEndDays = remainingDays > 0 ? Array.from({ length: 7 - remainingDays }, () => null) : [];
    const allDays = [...emptyStartDays, ...monthDays, ...emptyEndDays];
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }
    return weeks;
  }

  const monthGrid = getMonthGrid(currentMonth);
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  // Animation pour le changement de mode (dark/light)
  const [modeAnimValue] = useState(new Animated.Value(isDarkMode ? 1 : 0));
  const prevIsDarkMode = useRef(isDarkMode);

  useEffect(() => {
    if (prevIsDarkMode.current !== isDarkMode) {
      Animated.timing(modeAnimValue, {
        toValue: isDarkMode ? 1 : 0,
        duration: 400,
        useNativeDriver: false,
      }).start();
      prevIsDarkMode.current = isDarkMode;
    }
  }, [isDarkMode]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([{ id: 'all', name: 'Tous' }]);
  // Ajout d'un état pour la recherche
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // États pour les filtres collapsibles
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortOrder, setSortOrder] = useState<'price-asc' | 'price-desc' | 'duration-asc' | 'duration-desc' | 'name-asc' | 'name-desc'>('name-asc');
  
  // Animations pour les filtres
  const filtersAnimationValue = useRef(new Animated.Value(0)).current;
  const sortAnimationValue = useRef(new Animated.Value(0)).current;
  
  // États pour le modal de réservation
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [clientNotes, setClientNotes] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // État pour la carte de détail de prestation
  const [showPrestationDetail, setShowPrestationDetail] = useState(false);
  const [selectedPrestation, setSelectedPrestation] = useState<Service | null>(null);

  // Animations pour les filtres
  const timeSectionOpacity = useRef(new Animated.Value(0)).current;
  const timeSectionScale = useRef(new Animated.Value(0.9)).current;
  const selectedTimeAnimation = useRef(new Animated.Value(1)).current;

  // Fonction pour charger les rendez-vous
  const loadAppointments = async () => {
    if (!user || !token) return;
    
    try {
      const data = await getUserAppointments(token);
      
      // Analyser chaque rendez-vous individuellement
      if (Array.isArray(data)) {
        
        // Filtrer les rendez-vous invalides
        const validAppointments = data.filter((appointment, index) => {
          if (!appointment) {
            return false;
          }
          if (!appointment.service) {
            return false;
          }
          if (!appointment.service?.name) {
            return false;
          }
          
          return true;
        });
        
        setAppointments(validAppointments);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('💥 Erreur lors du chargement des rendez-vous:', error);
      if (error instanceof Error) {
        console.error('💥 Stack trace:', error.stack);
      }
      setAppointments([]);
    }
  };

  // Fonction pour obtenir les rendez-vous d'une date spécifique
  const getAppointmentsForDate = (date: Date) => {
    if (!appointments || appointments.length === 0) return [];
    
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(appointment => {
      // Vérifications complètes de l'objet appointment
      if (!appointment || !appointment.date || !appointment.service) return false;
      
      try {
        const appointmentDate = new Date(appointment.date).toISOString().split('T')[0];
        return appointmentDate === dateString;
      } catch (error) {
        console.error('Erreur lors du parsing de la date:', error);
        return false;
      }
    });
  };

  // Fonction pour charger les créneaux disponibles
  const loadAvailableSlots = async (date: Date) => {
    if (!selectedService) {
      return;
    }

    // Pour les prestations de moins d'1h : créneaux de 30min
    const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    
    const formattedSlots = timeSlots.map(time => ({ 
      time, 
      available: true, 
      period: parseInt(time.split(':')[0]) < 12 ? 'morning' : 'afternoon' 
    }));
    
    return formattedSlots;
  };

  // Effet pour charger les créneaux quand la date ou le service change
  useEffect(() => {
    if (selectedService && showBookingModal) {
      loadAvailableSlots(selectedDate);
      
      // Animation d'entrée pour la section horaire
      Animated.parallel([
        Animated.timing(timeSectionOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(timeSectionScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Réinitialiser l'animation
      timeSectionOpacity.setValue(0);
      timeSectionScale.setValue(0.9);
    }
  }, [selectedDate, selectedService, showBookingModal]);

  useEffect(() => {
    if (user && token) {
      loadServices();
      loadCategories();
      loadAppointments();
    }
  }, [user, token]);
  
  // Fonction pour tester la connectivité au serveur
  const testConnection = async () => {
    await testAndShowAPIConnection();
  };

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const response = await getAllServices(token || undefined);
      setServices(response);
    } catch (error: any) {
      console.error('Erreur lors du chargement des prestations:', error);
      // Si l'erreur est due à un timeout, proposer de tester la connexion
      const errorMsg = error?.message || '';
      if (errorMsg.includes('timeout') || errorMsg.includes('trop de temps')) {
        Alert.alert(
          'Erreur de connexion',
          'Impossible de charger les prestations. Voulez-vous tester la connexion au serveur?',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Tester', onPress: testConnection }
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getAllCategories(token || undefined);
      // On suppose que chaque catégorie a un id et un nom
      setCategories([{ id: 'all', name: 'Tous' }, ...response]);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  // Fonction pour gérer la réservation d'une prestation
  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setShowCalendarModal(true); // Ouvrir d'abord le calendrier
  };

  // Fonction pour afficher les détails d'une prestation
  const handlePrestationDetail = (prestation: Service) => {
    // Enrichir la prestation avec le nom de la catégorie
    const enrichedPrestation = {
      ...prestation,
      category: getCategoryName((prestation as ServiceWithCategoryId).categoryId)
    };
    setSelectedPrestation(enrichedPrestation);
    setShowPrestationDetail(true);
  };

  // Fonction pour réserver depuis la carte de détail
  const handleBookFromDetail = (prestation: Service) => {
    setShowPrestationDetail(false);
    handleBookService(prestation);
  };

  // Fonction pour gérer la sélection de date dans le calendrier
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowCalendarModal(false); // Fermer le calendrier
    setShowBookingModal(true); // Ouvrir le modal de sélection d'heure
    
    // Le useEffect va se charger automatiquement de charger les créneaux
    // car selectedDate va changer et showBookingModal sera true
  };

  // Fonction pour générer les jours du mois pour le calendrier
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Ajuster au lundi de la semaine contenant le premier jour
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    const days: (Date | null)[] = [];
    const current = new Date(startDate);
    
    // Générer 42 jours (6 semaines)
    for (let i = 0; i < 42; i++) {
      if (current.getMonth() === month) {
        days.push(new Date(current));
      } else {
        days.push(null);
      }
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Fonction pour vérifier si c'est aujourd'hui
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Fonction pour naviguer dans le calendrier
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  // Fonctions pour gérer les filtres collapsibles
  const toggleFilters = () => {
    const toValue = showFilters ? 0 : 1;
    
    Animated.timing(filtersAnimationValue, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setShowFilters(!showFilters);
  };

  const toggleSort = () => {
    const toValue = showSort ? 0 : 1;
    
    Animated.timing(sortAnimationValue, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setShowSort(!showSort);
  };

  // Options de tri disponibles
  const sortOptions = [
    { id: 'name-asc', label: 'Nom (A-Z)', icon: 'text-outline' as const },
    { id: 'name-desc', label: 'Nom (Z-A)', icon: 'text-outline' as const },
    { id: 'price-asc', label: 'Prix croissant', icon: 'arrow-up-outline' as const },
    { id: 'price-desc', label: 'Prix décroissant', icon: 'arrow-down-outline' as const },
    { id: 'duration-asc', label: 'Durée croissante', icon: 'time-outline' as const },
    { id: 'duration-desc', label: 'Durée décroissante', icon: 'time-outline' as const },
  ];

  // Fonction pour confirmer et créer la réservation
  const confirmBooking = async () => {
    if (!selectedService || !user || !token) {
      Alert.alert('Erreur', 'Informations manquantes pour la réservation');
      return;
    }

    // Pop-up de validation AVANT la réservation
    Alert.alert(
      'Confirmer la réservation',
      `Voulez-vous vraiment réserver la prestation "${selectedService.name || 'la prestation sélectionnée'}" le ${selectedDate.toLocaleDateString('fr-FR')} à ${selectedTime} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => {},
        },
        {
          text: 'Confirmer',
          style: 'default',
          onPress: async () => {
            try {
              setIsLoading(true);
              // Préparer les données selon le format attendu par l'API
              const appointmentData: CreateAppointmentRequest = {
                clientName: `${user.firstName} ${user.lastName || ''}`.trim() || 'Client',
                clientEmail: user.email, // Correct: clientEmail au lieu de email
                clientPhone: (user as any).phone || '', // Téléphone optionnel
                serviceId: selectedService.id, // Garder comme string
                date: selectedDate.toISOString().split('T')[0], // Format YYYY-MM-DD
                time: selectedTime, // Format HH:MM
                notes: clientNotes.trim() || '', // Notes optionnelles
                createdBy: String(user.id || user.email) // ID ou email de l'utilisateur qui crée
              };

              // Vérification que tous les champs requis sont présents
              if (!appointmentData.clientName || !appointmentData.clientEmail || !appointmentData.serviceId || !appointmentData.date || !appointmentData.time) {
                console.error('Champs manquants:', {
                  clientName: !!appointmentData.clientName,
                  clientEmail: !!appointmentData.clientEmail,
                  serviceId: !!appointmentData.serviceId,
                  date: !!appointmentData.date,
                  time: !!appointmentData.time
                });
                Alert.alert('Erreur', 'Tous les champs requis ne sont pas remplis');
                return;
              }

              console.log('Création du rendez-vous:', appointmentData);
              console.log('Type de serviceId:', typeof appointmentData.serviceId);
              console.log('Valeurs individuelles:', {
                clientName: appointmentData.clientName,
                clientEmail: appointmentData.clientEmail, 
                serviceId: appointmentData.serviceId,
                date: appointmentData.date,
                time: appointmentData.time
              });
              const newAppointment = await createAppointment(appointmentData, token);

              // Pop-up de validation APRÈS la réservation avec options
              Alert.alert(
                'Réservation confirmée !',
                `Votre rendez-vous pour "${selectedService.name || 'la prestation sélectionnée'}" a été réservé pour le ${selectedDate.toLocaleDateString('fr-FR')} à ${selectedTime}`,
                [
                  {
                    text: 'Voir mes rendez-vous',
                    style: 'default',
                    onPress: () => {
                      setShowBookingModal(false);
                      setSelectedService(null);
                      setClientNotes(''); // Réinitialiser les notes
                      loadAppointments(); // Recharger les rendez-vous pour mettre à jour le calendrier
                      // Naviguer vers l'écran des rendez-vous
                      (navigation as any).navigate('AppointmentsTab');
                    }
                  },
                  {
                    text: 'OK',
                    style: 'cancel',
                    onPress: () => {
                      setShowBookingModal(false);
                      setSelectedService(null);
                      setClientNotes(''); // Réinitialiser les notes
                      loadAppointments(); // Recharger les rendez-vous pour mettre à jour le calendrier
                      
                      // Notifier la page d'accueil qu'elle doit se rafraîchir
                      (navigation as any).navigate('HomeTab', { 
                        refresh: true, 
                        timestamp: Date.now() 
                      });
                    }
                  }
                ]
              );
            } catch (error: any) {
              console.error('Erreur lors de la création du rendez-vous:', error);
              Alert.alert(
                'Erreur',
                error?.response?.data?.message || 'Impossible de créer le rendez-vous. Veuillez réessayer.'
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Debug temporaire pour voir les valeurs de service.category et des catégories
  useEffect(() => {
    // Debug logs removed for performance
  }, [services, categories]);

  if (!user) {
    return (
      <View style={[
        { flex: 1, justifyContent: 'center', alignItems: 'center' },
        { backgroundColor: isDarkMode ? '#111827' : '#f8f9fa' }
      ]}>
        <Card style={[
          styles.card, 
          isDarkMode && styles.serviceCardDark,
          { width: '90%', maxWidth: 400, padding: 8 }
        ]}> 
          <Card.Content>
            <Title style={[{ color: '#333' }, isDarkMode && styles.serviceNameDark]}>OUPS !</Title>
            <Paragraph style={[{ color: '#333' }, isDarkMode && styles.serviceDescriptionDark]}>
              Veuillez vous connecter pour voir les prestations disponibles.
            </Paragraph>
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('AuthTab' as never)}
              style={{ backgroundColor: '#1a73e8' }}
            >
              Se connecter
            </Button>
          </Card.Actions>
        </Card>
      </View>
    );
  }

  // Correction du typage Service pour accepter categoryId
  type ServiceWithCategoryId = Service & { categoryId?: number | null };
  
  // Fonction pour construire l'URL de l'image (même logique que HomeScreen)
  const getServiceImageUrl = (service: Service): string | null => {
    if (service.image && service.image !== 'null' && service.image !== '') {
      // Utiliser la route API spécifique pour récupérer l'image par ID de service
      const imageUrl = `${API_URL}/services/${service.id}/image`;
      return imageUrl;
    }
    return null;
  };
  
  // Correction du filtrage pour que selectedCategory soit bien un string (id) et conversion lors de la comparaison
  const filteredServices = (services as ServiceWithCategoryId[]).filter(service => {
    if (!service) return false;
    // Filtre par catégorie
    if (selectedCategory && selectedCategory !== 'all') {
      if (String(service.categoryId) !== String(selectedCategory)) return false;
    }
    // Filtre par recherche
    if (showSearch && search && !service.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Fonction pour trier les services
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortOrder) {
      case 'name-asc':
        return (a.name || '').localeCompare(b.name || '');
      case 'name-desc':
        return (b.name || '').localeCompare(a.name || '');
      case 'price-asc':
        return (a.price || 0) - (b.price || 0);
      case 'price-desc':
        return (b.price || 0) - (a.price || 0);
      case 'duration-asc':
        return (a.duration || 0) - (b.duration || 0);
      case 'duration-desc':
        return (b.duration || 0) - (a.duration || 0);
      default:
        return 0;
    }
  });

  // Trouver le nom de la catégorie à partir de l'id
  const getCategoryName = (categoryId: number | null | undefined) => {
    if (!categoryId) return 'Catégorie inconnue';
    const cat = categories.find(c => String(c.id) === String(categoryId));
    return cat ? cat.name : 'Catégorie inconnue';
  };

  if (isLoading) {
    return <Loading />;
  }

  // Renvoie la liste par défaut des créneaux horaires (matin et après-midi, 30min)
  function getDefaultTimeSlots() {
    // Créneaux de 30 minutes de 9h à 12h et de 14h à 17h
    const slots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];
    return slots.map(time => ({
      time,
      available: true,
      period: parseInt(time.split(':')[0], 10) < 12 ? 'morning' : 'afternoon'
    }));
  }

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: modeAnimValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['#f8f9fa', '#111827']
        })
      }}
    >
      <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>ServiceBooking</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>Découvrez nos prestations et réservez</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={testConnection} style={{ marginRight: 15 }}>
            <Ionicons name="refresh" size={24} color={isDarkMode ? "#60A5FA" : "#3498db"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSearch(s => !s)}>
            <Ionicons name="search" size={24} color={isDarkMode ? "#fff" : "#333"} />
          </TouchableOpacity>
        </View>
      </View>
      
      {showSearch && (
        <TextInput
          style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
          placeholder="Rechercher un service..."
          placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      )}
      
      {/* Saut de ligne avant les filtres */}
      <View style={{ height: 10 }} />
      
      {/* Compteur de services - au-dessus des filtres */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 8,
        backgroundColor: isDarkMode ? '#111827' : '#f8f9fa'
      }}>
        <Text style={[styles.servicesCount, isDarkMode && styles.servicesCountDark, { fontSize: 18, fontWeight: '700' }]}>
          {sortedServices.length} service{sortedServices.length > 1 ? 's' : ''} disponible{sortedServices.length > 1 ? 's' : ''}
        </Text>
      </View>
      
      {/* Section des boutons de filtres et tri */}
      <View style={[
        styles.tabContainer, 
        isDarkMode && styles.tabContainerDark,
        { backgroundColor: isDarkMode ? '#111827' : '#f8f9fa' }
      ]}>
        <View style={styles.tabWrapper}>
        </View>
        
        {/* Boutons de filtres et tri - alignés à droite */}
        <View style={styles.actionButtonsContainerRight}>
          <TouchableOpacity 
            onPress={toggleFilters}
            style={[
              styles.filterToggleButton, 
              isDarkMode && styles.filterToggleButtonDark,
              (selectedCategory && selectedCategory !== 'all') && styles.filterToggleButtonActive
            ]}
          >
            <Ionicons 
              name={showFilters ? "close" : "filter"} 
              size={20} 
              color={
                (selectedCategory && selectedCategory !== 'all') 
                  ? "#fff" 
                  : (isDarkMode ? "#60A5FA" : "#3498db")
              } 
            />
            <Text style={[
              styles.filterToggleText, 
              isDarkMode && styles.filterToggleTextDark,
              (selectedCategory && selectedCategory !== 'all') && styles.filterToggleTextActive
            ]}>
              {showFilters ? "Fermer" : "Filtres"}
            </Text>
            {(selectedCategory && selectedCategory !== 'all') && (
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
              (sortOrder !== 'name-asc') && styles.sortToggleButtonActive
            ]}
          >
            <Ionicons 
              name={showSort ? "close" : "swap-vertical"} 
              size={20} 
              color={
                (sortOrder !== 'name-asc') 
                  ? "#fff" 
                  : (isDarkMode ? "#60A5FA" : "#3498db")
              } 
            />
            <Text style={[
              styles.sortToggleText, 
              isDarkMode && styles.sortToggleTextDark,
              (sortOrder !== 'name-asc') && styles.sortToggleTextActive
            ]}>
              {showSort ? "Fermer" : "Tri"}
            </Text>
            {(sortOrder !== 'name-asc') && (
              <View style={styles.sortIndicator}>
                <Text style={styles.sortIndicatorText}>•</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Bouton Clear visible seulement si des filtres sont appliqués */}
          {((selectedCategory && selectedCategory !== 'all') || sortOrder !== 'name-asc') && (
            <TouchableOpacity 
              onPress={() => {
                setSelectedCategory('all');
                setSortOrder('name-asc');
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

      {/* Section des filtres par catégorie */}
      {showFilters && (
        <Animated.View 
          style={[
            styles.filtersSection, 
            isDarkMode && styles.filtersSectionDark,
            {
              opacity: filtersAnimationValue,
              maxHeight: filtersAnimationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 300],
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
          
          {/* Filtre par catégorie */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, isDarkMode && styles.filterLabelDark]}>
              Par catégorie
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFilterList}
            >
              {categories.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.categoryFilterButton,
                    isDarkMode && styles.categoryFilterButtonDark,
                    selectedCategory === item.id && styles.categoryFilterButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(item.id)}
                >
                  <Text style={[
                    styles.categoryFilterText,
                    isDarkMode && styles.categoryFilterTextDark,
                    selectedCategory === item.id && styles.categoryFilterTextActive,
                  ]}>
                    {item.name || 'Catégorie'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      )}

      {/* Section du tri */}
      {showSort && (
        <Animated.View 
          style={[
            styles.sortSection, 
            isDarkMode && styles.sortSectionDark,
            {
              opacity: sortAnimationValue,
              maxHeight: sortAnimationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 300],
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
              Trier par
            </Text>
          </View>
          
          <View style={styles.sortOptionsContainer}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.sortOptionButton,
                  isDarkMode && styles.sortOptionButtonDark,
                  sortOrder === option.id && styles.sortOptionButtonActive,
                ]}
                onPress={() => setSortOrder(option.id as any)}
              >
                <Ionicons 
                  name={option.icon} 
                  size={16} 
                  color={
                    sortOrder === option.id 
                      ? "#fff" 
                      : (isDarkMode ? "#9CA3AF" : "#666")
                  } 
                />
                <Text style={[
                  styles.sortOptionText,
                  isDarkMode && styles.sortOptionTextDark,
                  sortOrder === option.id && styles.sortOptionTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.servicesList}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.servicesGrid}>
          {sortedServices.map((item) =>
            item ? (
              <TouchableOpacity 
                key={item.id}
                style={[styles.serviceCard, isDarkMode && styles.serviceCardDark]}
                onPress={() => handlePrestationDetail(item)}
              >
                {getServiceImageUrl(item) ? (
                  <Image 
                    source={{ uri: getServiceImageUrl(item)! }} 
                    style={styles.serviceImage}
                    onError={(error) => {
                      // Image failed to load
                    }}
                    onLoad={() => {
                      // Image loaded successfully
                    }}
                  />
                ) : (
                  <View style={[
                    styles.serviceImage, 
                    { 
                      backgroundColor: isDarkMode ? '#374151' : '#f0f0f0', 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }
                  ]}>
                    <Text style={{ fontSize: 20 }}>📷</Text>
                  </View>
                )}
                <View style={styles.serviceContent}>
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, isDarkMode && styles.serviceNameDark]} numberOfLines={1}>
                      {item.name || 'Service'}
                    </Text>
                    <Text style={[styles.servicePrice, isDarkMode && styles.servicePriceDark]}>{item.price || 0} €</Text>
                  </View>
                  {/* Affichage du nom de la catégorie associée, en couleur bleue et gras */}
                  <Text style={{ 
                    color: isDarkMode ? '#60A5FA' : '#3498db', 
                    fontWeight: 'bold', 
                    fontSize: 11, 
                    marginBottom: 4 
                  }} numberOfLines={1}>
                    {getCategoryName((item as ServiceWithCategoryId).categoryId)}
                  </Text>
                  <Text style={[styles.serviceDescription, isDarkMode && styles.serviceDescriptionDark]} numberOfLines={3}>
                    {item.description || 'Description de la prestation'}
                  </Text>
                  <View style={styles.serviceFooter}>
                    <View style={styles.serviceDuration}>
                      <Ionicons 
                        name="time-outline" 
                        size={14} 
                        color={isDarkMode ? '#9CA3AF' : '#666'} 
                      />
                      <Text style={[styles.serviceDurationText, isDarkMode && styles.serviceDurationTextDark]}>
                        {item.duration || 0} min
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.bookButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleBookService(item);
                      }}
                    >
                      <Text style={styles.bookButtonText}>Réserver</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ) : null
          )}
        </View>
      </ScrollView>

      {/* Modal de calendrier */}
      <Modal
        visible={showCalendarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={[styles.modalOverlay, isDarkMode && styles.modalOverlayDark]}>
          <View style={[styles.calendarModalContent, isDarkMode && styles.calendarModalContentDark]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Choisir une date</Text>

            {/* En-tête du calendrier */}
            <View style={[styles.calendarHeader, isDarkMode && styles.calendarHeaderDark]}>
              <TouchableOpacity 
                onPress={() => navigateCalendar('prev')} 
                style={styles.navButton}
              >
                <Ionicons name="chevron-back-circle" size={24} color="#3498db" />
              </TouchableOpacity>
              
              <Text style={styles.calendarTitle}>
                {selectedDate.toLocaleDateString('fr-FR', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
              
              <TouchableOpacity 
                onPress={() => navigateCalendar('next')} 
                style={styles.navButton}
              >
                <Ionicons name="chevron-forward-circle" size={24} color="#3498db" />
              </TouchableOpacity>
            </View>

            {/* Calendrier */}
            <View style={[styles.calendarContainer, isDarkMode && styles.calendarContainerDark]}>
              {/* En-tête des jours de la semaine */}
              <View style={[styles.weekDaysHeader, isDarkMode && styles.weekDaysHeaderDark]}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dayName, index) => (
                  <View key={`header-${index}`} style={styles.dayNameHeader}>
                    <Text style={[styles.dayNameText, isDarkMode && styles.dayNameTextDark]}>{dayName}</Text>
                  </View>
                ))}
              </View>
              
              {/* Grille des jours */}
              <View style={styles.monthGrid}>
                {(() => {
                  const days = generateCalendarDays(selectedDate);
                  const weeks = [];
                  for (let i = 0; i < days.length; i += 7) {
                    weeks.push(days.slice(i, i + 7));
                  }
                  
                  return weeks.map((week, weekIndex) => (
                    <View key={`week-${weekIndex}`} style={styles.weekRow}>
                      {week.map((dayItem, dayIndex) => {
                        if (dayItem === null) {
                          return (
                            <View 
                              key={`empty-${weekIndex}-${dayIndex}`} 
                              style={[styles.calendarDayButton, styles.emptyDay]} 
                            />
                          );
                        }
                        
                        const isPast = dayItem < new Date(new Date().setHours(0, 0, 0, 0));
                        const dayAppointments = getAppointmentsForDate(dayItem);
                        
                        return (
                          <TouchableOpacity
                            key={dayItem.toDateString()}
                          style={[
                              styles.calendarDayButton,
                              isDarkMode && styles.calendarDayButtonDark,
                              isToday(dayItem) && [styles.todayButton, isDarkMode && styles.todayButtonDark],
                              dayItem.toDateString() === selectedDate.toDateString() && styles.dayButtonSelected,
                              isPast && styles.pastDayButton
                            ]}
                            onPress={() => !isPast && handleDateSelect(dayItem)}
                            disabled={isPast}
                          >
                            <Text style={[
                              styles.calendarDayText,
                              isDarkMode && styles.calendarDayTextDark,
                              dayItem.toDateString() === selectedDate.toDateString() && styles.selectedDayText,
                              isPast && [styles.pastDayText, isDarkMode && styles.pastDayTextDark]
                            ]}>
                              {dayItem.getDate()}
                            </Text>
                            {dayAppointments.length > 0 && (
                              <View style={styles.appointmentIndicator}>
                                <Text style={styles.appointmentIndicatorText}>
                                  {`${dayAppointments.length} rdv`}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ));
                })()}
              </View>
            </View>

            {/* Bouton fermer modernisé */}
            <TouchableOpacity
              style={[
                styles.closeIconButton,
                isDarkMode && styles.closeIconButtonDark
              ]}
              onPress={() => setShowCalendarModal(false)}
              accessibilityLabel="Fermer le calendrier"
            >
              <Ionicons
                name="close"
                size={24}
                color={isDarkMode ? '#F3F4F6' : '#333'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de réservation */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View style={[
          styles.modalOverlay,
          isDarkMode && styles.modalOverlayDark,
          isDarkMode && { borderColor: '#374151', borderWidth: 1 }
        ]}>
          <View style={[
            styles.modalContent,
            isDarkMode && styles.modalContentDark,
            isDarkMode && { borderColor: '#374151', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.7, shadowRadius: 12 }
          ]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Choisir un créneau</Text>
            
            {selectedService && (
              <View style={styles.serviceInfoModal}>
                <Text style={styles.serviceNameModal}>{selectedService.name || 'Prestation sélectionnée'}</Text>
                <Text style={styles.servicePriceModal}>{selectedService.price || 0}€ • {selectedService.duration || 0} min</Text>
                <Text style={styles.serviceDescModal}>{selectedService.description || 'Description du service'}</Text>
              </View>
            )}

            {/* Date sélectionnée */}
            <View style={styles.selectedDateSection}>
              <Text style={styles.sectionLabel}>Date sélectionnée</Text>
              <TouchableOpacity 
                style={styles.selectedDateDisplay}
                onPress={() => {
                  setShowBookingModal(false);
                  setShowCalendarModal(true);
                }}
              >
                <Ionicons name="calendar-outline" size={20} color="#3498db" />
                <Text style={styles.selectedDateDisplayText}>
                  {selectedDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </Text>
                <Ionicons name="pencil-outline" size={16} color="#3498db" />
              </TouchableOpacity>
            </View>

            {/* Contenu scrollable */}
            <ScrollView style={styles.modalScrollableContent} showsVerticalScrollIndicator={false}>

            {/* Affichage des rendez-vous du jour sélectionné */}
            {(() => {
              const dayAppointments = getAppointmentsForDate(selectedDate);
              if (dayAppointments.length > 0) {
                return (
                  <View style={styles.appointmentsSection}>
                    <Text style={styles.sectionLabel}>
                      Rendez-vous du {selectedDate.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </Text>
                    <View style={styles.appointmentSimpleView}>
                      <View style={styles.appointmentSimpleInfo}>
                        <Ionicons name="calendar" size={20} color="#3498db" />
                        <Text style={styles.appointmentSimpleText}>
                          {dayAppointments.length === 1 ? 'Un rendez-vous' : `${dayAppointments.length} rendez-vous`}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.viewMoreButton}
                        onPress={() => {
                          setShowBookingModal(false);
                          navigation.navigate('AppointmentsTab' as never);
                        }}
                      >
                        <Text style={styles.viewMoreButtonText}>Voir plus</Text>
                        <Ionicons name="chevron-forward" size={16} color="#3498db" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
              return null;
            })()}

            {/* Sélection de l'heure - Section améliorée */}
            <Animated.View 
              style={[
                styles.timeSection,
                {
                  opacity: timeSectionOpacity,
                  transform: [{ scale: timeSectionScale }]
                }
              ]}
            >
              <View style={styles.timeSectionHeader}>
                <Ionicons name="time-outline" size={22} color="#3498db" />
                <Text style={styles.sectionLabelEnhanced}>Choisissez votre horaire</Text>
              </View>
              
              {/* Indicateur de progression */}
              <View style={styles.progressIndicator}>
                <View style={styles.progressStep}>
                  <View style={[styles.progressDot, styles.progressDotCompleted]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                  <Text style={styles.progressStepText}>Service</Text>
                </View>
                <View style={styles.progressLine}></View>
                <View style={styles.progressStep}>
                  <View style={[styles.progressDot, styles.progressDotCompleted]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                  <Text style={styles.progressStepText}>Date</Text>
                </View>
                <View style={styles.progressLine}></View>
                <View style={styles.progressStep}>
                  <View style={[styles.progressDot, selectedTime ? styles.progressDotCompleted : styles.progressDotActive]}>
                    {selectedTime ? (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    ) : (
                      <Text style={styles.progressDotNumber}>3</Text>
                    )}
                  </View>
                  <Text style={styles.progressStepText}>Heure</Text>
                </View>
              </View>
              
              {/* Indication de l'heure sélectionnée */}
              {selectedTime && (
                <Animated.View 
                  style={[
                    styles.selectedTimeIndicator,
                    {
                      transform: [{ scale: selectedTimeAnimation }]
                    }
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.selectedTimeText}>
                    Créneau confirmé : {selectedTime}
                  </Text>
                  <TouchableOpacity 
                    style={styles.changeTimeButton}
                    onPress={() => setSelectedTime('')}
                  >
                    <Text style={styles.changeTimeText}>Modifier</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
              
              {/* Instructions pour l'utilisateur */}
              {!selectedTime ? (
                <View style={styles.instructionsBox}>
                  <Ionicons name="information-circle-outline" size={16} color="#3498db" />
                  <Text style={styles.instructionsText}>
                    Sélectionnez un créneau horaire disponible pour continuer
                  </Text>
                </View>
              ) : (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.successText}>
                    Parfait ! Vous pouvez maintenant confirmer votre réservation
                  </Text>
                </View>
              )}
              
              {loadingSlots ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="time-outline" size={24} color="#3498db" />
                  <Text style={styles.loadingText}>Vérification des créneaux disponibles...</Text>
                  <Text style={styles.loadingSubtext}>
                    Nous vérifions les disponibilités pour {selectedDate.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </Text>
                </View>
              ) : (
                <>
                  {(() => {
                    const totalSlots = availableSlots.length > 0 ? availableSlots : getDefaultTimeSlots();
                    
                    return null; // Just for the logic, no visual output needed
                  })()}
                  
                  {/* Créneaux du matin - Section améliorée */}
                  <View style={styles.timePeriodSection}>
                    <View style={styles.timePeriodHeader}>
                      <Ionicons name="sunny-outline" size={20} color="#f39c12" />
                      <Text style={styles.timePeriodTitle}>Matinée (9h - 12h)</Text>
                      <View style={styles.periodBadge}>
                        <Text style={styles.periodBadgeText}>
                          {(availableSlots.length > 0 ? availableSlots : getDefaultTimeSlots())
                            .filter((slot: any) => {
                              const hour = parseInt(slot.time.split(':')[0]);
                              return hour >= 9 && hour < 12 && slot.available;
                            }).length} dispos
                        </Text>
                      </View>
                    </View>
                    <View style={styles.timeButtonsContainer}>
                      {(availableSlots.length > 0 ? availableSlots : getDefaultTimeSlots())
                        .filter((slot: any) => {
                          const hour = parseInt(slot.time.split(':')[0]);
                          return hour >= 9 && hour < 12;
                        })
                        .map((slot: any, index: number) => {
                          return (
                            <TouchableOpacity
                              key={`morning-${index}`}
                              style={[
                                styles.timeButton,
                                selectedTime === slot.time && styles.timeButtonSelected,
                                !slot.available && styles.timeButtonDisabled
                              ]}
                              onPress={() => {
                                if (slot.available) {
                                  setSelectedTime(slot.time);
                                  
                                  // Animation de confirmation
                                  Animated.sequence([
                                    Animated.timing(selectedTimeAnimation, {
                                      toValue: 1.1,
                                      duration: 150,
                                      useNativeDriver: true,
                                    }),
                                    Animated.timing(selectedTimeAnimation, {
                                      toValue: 1,
                                      duration: 150,
                                      useNativeDriver: true,
                                    })
                                  ]).start();
                                }
                              }}
                              disabled={!slot.available}
                            >
                              <Text style={[
                                styles.timeButtonText,
                                selectedTime === slot.time && styles.timeButtonTextSelected,
                                !slot.available && styles.timeButtonTextDisabled
                              ]}>
                                {slot.time}
                              </Text>
                              {selectedTime === slot.time && (
                                <Ionicons name="checkmark-circle" size={14} color="#fff" style={styles.timeButtonCheck} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                    </View>
                  </View>

                  {/* Créneaux de l'après-midi - Section améliorée */}
                  <View style={styles.timePeriodSection}>
                    <View style={styles.timePeriodHeader}>
                      <Ionicons name="partly-sunny-outline" size={20} color="#e67e22" />
                      <Text style={styles.timePeriodTitle}>Après-midi (14h - 17h)</Text>
                      <View style={styles.periodBadge}>
                        <Text style={styles.periodBadgeText}>
                          {(availableSlots.length > 0 ? availableSlots : getDefaultTimeSlots())
                            .filter((slot: any) => {
                              const hour = parseInt(slot.time.split(':')[0]);
                              return hour >= 14 && hour < 17 && slot.available;
                            }).length} dispos
                        </Text>
                      </View>
                    </View>
                    <View style={styles.timeButtonsContainer}>
                      {(availableSlots.length > 0 ? availableSlots : getDefaultTimeSlots())
                        .filter((slot: any) => {
                          const hour = parseInt(slot.time.split(':')[0]);
                          return hour >= 14 && hour < 17;
                        })
                        .map((slot: any, index: number) => {
                          return (
                            <TouchableOpacity
                              key={`afternoon-${index}`}
                              style={[
                                styles.timeButton,
                                selectedTime === slot.time && styles.timeButtonSelected,
                                !slot.available && styles.timeButtonDisabled
                              ]}
                              onPress={() => {
                                if (slot.available) {
                                  setSelectedTime(slot.time);
                                  
                                  // Animation de confirmation
                                  Animated.sequence([
                                    Animated.timing(selectedTimeAnimation, {
                                      toValue: 1.1,
                                      duration: 150,
                                      useNativeDriver: true,
                                    }),
                                    Animated.timing(selectedTimeAnimation, {
                                      toValue: 1,
                                      duration: 150,
                                      useNativeDriver: true,
                                    })
                                  ]).start();
                                }
                              }}
                              disabled={!slot.available}
                            >
                              <Text style={[
                                styles.timeButtonText,
                                selectedTime === slot.time && styles.timeButtonTextSelected,
                                !slot.available && styles.timeButtonTextDisabled
                              ]}>
                                {slot.time}
                              </Text>
                              {selectedTime === slot.time && (
                                <Ionicons name="checkmark-circle" size={14} color="#fff" style={styles.timeButtonCheck} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                    </View>
                  </View>
                </>
              )}
            </Animated.View>

            {/* Section Notes */}
            <View style={styles.notesSection}>
              <Text style={styles.sectionLabel}>Notes (optionnel)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Ajoutez une note pour votre rendez-vous..."
                value={clientNotes}
                onChangeText={setClientNotes}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.notesCounter}>
                {clientNotes.length}/200 caractères
              </Text>
            </View>
            </ScrollView>

            {/* Résumé de la réservation */}
            {selectedTime && (
              <View style={styles.bookingSummary}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="document-text-outline" size={20} color="#3498db" />
                  <Text style={styles.summaryTitle}>Résumé de votre réservation</Text>
                </View>
                <View style={styles.summaryContent}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Service :</Text>
                    <Text style={styles.summaryValue}>{selectedService?.name}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Date :</Text>
                    <Text style={styles.summaryValue}>
                      {selectedDate.toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Heure :</Text>
                    <Text style={styles.summaryValue}>{selectedTime}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Prix :</Text>
                    <Text style={[styles.summaryValue, styles.summaryPrice]}>{selectedService?.price || 0}€</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Boutons d'action - en dehors du ScrollView */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowBookingModal(false);
                  setSelectedService(null);
                  setClientNotes(''); // Réinitialiser les notes
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => {
                  console.log('🎯 Tentative de confirmation de réservation');
                  console.log('🕐 Heure sélectionnée:', selectedTime);
                  console.log('📅 Date sélectionnée:', selectedDate);
                  console.log('🔧 Prestation sélectionnée:', selectedService?.name);
                  confirmBooking();
                }}
                disabled={isLoading || !selectedTime}
              >
                <Text style={styles.confirmButtonText}>
                  {isLoading 
                    ? 'Réservation...' 
                    : selectedTime 
                      ? `Confirmer pour ${selectedTime}` 
                      : 'Sélectionnez une heure'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Carte de détail de prestation */}
      <PrestationDetailCard
        prestation={selectedPrestation}
        visible={showPrestationDetail}
        onClose={() => setShowPrestationDetail(false)}
        onBook={handleBookFromDetail}
        isDarkMode={isDarkMode}
      />
      
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Styles pour les filtres collapsibles (copiés d'AppointmentsScreen)
  tabContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabContainerDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  tabWrapper: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  servicesCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  servicesCountDark: {
    color: '#E5E7EB',
  },
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
  filterToggleButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
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
  filterToggleTextActive: {
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
  sortToggleButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
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
  sortToggleTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  sortIndicator: {
    marginLeft: 4,
  },
  sortIndicatorText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  categoryFilterButton: {
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
  categoryFilterButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  categoryFilterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryFilterTextDark: {
    color: '#9CA3AF',
  },
  categoryFilterTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  categoryFilterList: {
    paddingHorizontal: 0,
  },
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
  sortOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    minWidth: 120,
  },
  sortOptionButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  sortOptionButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 6,
  },
  sortOptionTextDark: {
    color: '#9CA3AF',
  },
  sortOptionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // Styles existants
  monthGridDark: {
    backgroundColor: '#1F2937',
  },
  // --- Styles HomeScreen calendar ---
  navButtonDark: {
    backgroundColor: '#374151',
  },
  currentMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  currentMonthTextDark: {
    color: '#fff',
  },
  monthViewEmptyDay: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    opacity: 0.4,
    width: 36,
    height: 36,
  },
  monthViewDayButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  monthViewDayButtonDark: {
    backgroundColor: '#111827',
  },
  monthViewDayButtonSelected: {
    backgroundColor: '#4F8EF7',
  },
  monthViewTodayButton: {
    backgroundColor: '#e8f1ff',
  },
  monthViewTodayText: {
    color: '#4F8EF7',
    fontWeight: '600',
  },
  monthViewDayLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  monthViewDayLabelDark: {
    color: '#fff',
  },
  monthViewSelectedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledDay: {
    opacity: 0.3,
  },
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
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoryContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryList: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 14,  // Réduit de 20 à 14
    paddingVertical: 8,     // Réduit de 12 à 8
    borderRadius: 20,       // Réduit de 24 à 20
    marginRight: 8,         // Réduit de 12 à 8
    backgroundColor: '#f1f1f1',
    shadowColor: '#000',    // Ajout d'une ombre légère
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCategory: {
    backgroundColor: '#3498db',
  },
  categoryText: {
    fontSize: 14,           // Réduit de 16 à 14
    color: '#444',          // Couleur plus foncée pour une meilleure lisibilité
    fontWeight: '500',      // Ajout d'un poids de police plus important
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  servicesList: {
    padding: 8,
    paddingBottom: 20,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '48%',
    minHeight: 280,
  },
  serviceImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  serviceContent: {
    padding: 14,
    flex: 1,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  servicePrice: {
    fontSize: 13,
    color: '#3498db',
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
    flex: 1,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 8,
  },
  serviceDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDurationText: {
    marginLeft: 4,
    fontSize: 11,
    color: '#666',
  },
  bookButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3498db',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  // Styles pour le modal de réservation
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalContentScrollable: {
    padding: 20,
  },
  modalScrollableContent: {
    flex: 1,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  serviceInfoModal: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  serviceNameModal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  servicePriceModal: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
    marginBottom: 5,
  },
  serviceDescModal: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  dateSection: {
    marginBottom: 20,
  },
  timeSection: {
    marginBottom: 30,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  dateButton: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginRight: 10,
    minWidth: 60,
  },
  selectedDateButton: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  dateButtonText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  selectedDateText: {
    color: '#fff',
  },
  dateNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedDateNumber: {
    color: '#fff',
  },
  dateScrollView: {
    flexDirection: 'row',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    textTransform: 'capitalize',
  },
  timeScrollView: {
    flexDirection: 'row',
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 70,
    alignItems: 'center',
  },
  timeButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  timeButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  timeButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#d0d0d0',
  },
  timeButtonTextDisabled: {
    color: '#999',
    fontWeight: '400',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 12,
    fontWeight: '500',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timePeriodSection: {
    marginBottom: 20,
  },
  timePeriodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  timePeriodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  timeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // Styles pour le calendrier modal
  calendarModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '95%',
    maxHeight: '70%',
  },
  serviceInfoCalendar: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  navButton: {
    padding: 5,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  calendarContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayNameHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  monthGrid: {
    gap: 5,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  calendarDayButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  emptyDay: {
    opacity: 0,
  },
  todayButton: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  dayButtonSelected: {
    backgroundColor: '#3498db',
  },
  pastDayButton: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pastDayText: {
    color: '#999',
  },
  closeIconButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  closeIconButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowRadius: 8,
  },
  // Styles pour la section date sélectionnée
  selectedDateSection: {
    marginBottom: 20,
  },
  selectedDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'space-between',
  },
  selectedDateDisplayText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 10,
    textTransform: 'capitalize',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  confirmButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  // Styles pour la section notes
  notesSection: {
    marginBottom: 30,
  },
  notesInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesCounter: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  // Styles pour les indicateurs de rendez-vous
  appointmentIndicator: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 1,
    paddingHorizontal: 2,
  },
  appointmentIndicatorText: {
    fontSize: 8,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  // Styles pour la section des rendez-vous
  appointmentsSection: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  appointmentSimpleView: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  appointmentSimpleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentSimpleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginLeft: 10,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  viewMoreButtonText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '600',
    marginRight: 4,
  },
  appointmentItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    marginLeft: 5,
  },
  appointmentServiceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 2,
    textAlign: 'center',
  },
  appointmentStatus: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 1,
    textAlign: 'center',
  },
  // Nouveaux styles pour la section filtres
  filtersSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filtersIcon: {
    marginRight: 6,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
  searchInputDark: {
    backgroundColor: '#374151', // gray-700
    borderColor: '#4B5563', // gray-600
    color: '#FFFFFF',
  },
  categoryContainerDark: {
    backgroundColor: '#1F2937', // gray-800
    borderBottomColor: '#374151', // gray-700
  },
  categoryButtonDark: {
    backgroundColor: '#374151', // gray-700
  },
  categoryTextDark: {
    color: '#9CA3AF', // gray-400
  },
  serviceCardDark: {
    backgroundColor: '#1F2937', // gray-800
    borderColor: 'rgba(255,255,255,0.05)',
  },
  serviceNameDark: {
    color: '#FFFFFF',
  },
  serviceDescriptionDark: {
    color: '#9CA3AF', // gray-400
  },
  servicePriceDark: {
    color: '#60A5FA', // blue-400
  },
  serviceDurationTextDark: {
    color: '#9CA3AF', // gray-400
  },
  modalOverlayDark: {
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContentDark: {
    backgroundColor: '#1F2937', // gray-800
  },
  calendarModalContentDark: {
    backgroundColor: '#1F2937', // gray-800
  },
  calendarHeaderDark: {
    backgroundColor: '#111827',
  },
  calendarContainerDark: {
    backgroundColor: '#111827',
    borderColor: '#374151',
  },
  weekDaysHeaderDark: {
    backgroundColor: '#1F2937',
  },
  dayNameTextDark: {
    color: '#9CA3AF',
  },
  calendarDayButtonDark: {
    backgroundColor: '#374151',
  },
  calendarDayTextDark: {
    color: '#F3F4F6',
  },
  todayButtonDark: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  pastDayTextDark: {
    color: '#6B7280',
  },
  modalTitleDark: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#FFFFFF',
  },
  textSecondaryDark: {
    color: '#9CA3AF', // gray-400
  },
  buttonDark: {
    backgroundColor: '#374151', // gray-700
  },
  // Styles dark pour la section filtres
  filtersSectionDark: {
    backgroundColor: '#1F2937', // gray-800
    borderBottomColor: '#374151', // gray-700
  },
  filtersTitleDark: {
    color: '#FFFFFF',
  },
  // Styles pour l'indicateur d'heure sélectionnée
  selectedTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  selectedTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
    flex: 1,
  },
  changeTimeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  changeTimeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  // Styles pour les badges de période
  periodBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  periodBadgeText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
  },
  // Styles pour les icônes de confirmation des boutons de temps
  timeButtonCheck: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  // Styles pour l'en-tête de section amélioré
  timeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionLabelEnhanced: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginLeft: 10,
  },
  // Styles pour l'indicateur de progression
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressDotActive: {
    backgroundColor: '#3498db',
  },
  progressDotCompleted: {
    backgroundColor: '#10B981',
  },
  progressDotNumber: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  progressStepText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Styles pour la boîte d'instructions
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  instructionsText: {
    fontSize: 14,
    color: '#2563EB',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  // Styles pour la boîte de succès
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  successText: {
    fontSize: 14,
    color: '#059669',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  // Styles pour le résumé de réservation
  bookingSummary: {
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  summaryContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  summaryPrice: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '700',
  },
  // Styles pour l'affichage en deux colonnes
  serviceRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 1,
    gap: 2,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 8,
  },
});

export default ServicesScreen;
