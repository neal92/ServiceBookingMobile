import React, { useContext, useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, FlatList, Image, Animated, Dimensions, Modal } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton } from 'react-native-paper';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getUserAppointments, createAppointment, getAvailableTimeSlots, checkTimeSlotAvailability } from '../../api/appointments';
import { getAllServices } from '../../api/services';
import { getUserNotifications, deleteNotification } from '../../api/notifications';
import { Appointment, Service, Notification, CreateAppointmentRequest } from '../../types/index';
import { AppointmentList } from '../../components/appointments/AppointmentList';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/api';

const HomeScreen = ({ navigation }: any) => {
  const { user, token } = useContext(AuthContext);
  const { theme, toggleTheme, isDarkMode } = useContext(ThemeContext);
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // États pour la popup de réservation
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState<'service' | 'time'>('service'); // Étape courante
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Animations pour le calendrier
  const calendarHeight = useRef(new Animated.Value(160)).current; // Augmenté à 160 pour bien afficher les jours et le bouton
  const calendarOpacity = useRef(new Animated.Value(1)).current;
  const monthGridScale = useRef(new Animated.Value(0)).current;
  
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(() => {
    const date = new Date();
    // Ajuster au début de la semaine (lundi)
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuster quand c'est dimanche
    return new Date(date.setDate(diff));
  });

  // Animation pour le changement de vue calendrier
  useEffect(() => {
    if (viewMode === 'month') {
      // Animation vers le mode mois
      Animated.parallel([
        Animated.timing(calendarHeight, {
          toValue: 360, // Augmenté de 320 à 360 pour contenir tous les jours du mois
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(calendarOpacity, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(calendarOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          })
        ]),
        Animated.spring(monthGridScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        })
      ]).start();
    } else {
      // Animation vers le mode semaine
      Animated.parallel([
        Animated.timing(calendarHeight, {
          toValue: 160, // Augmenté de 140 à 160 pour plus d'espace avec le bouton
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(calendarOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(monthGridScale, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        })
      ]).start();
    }
  }, [viewMode]);

  React.useEffect(() => {
    const fetchAppointments = async () => {
      if (user && token) {
        setIsLoading(true);
        try {
          const data = await getUserAppointments(token);
          console.log('📅 Données rendez-vous reçues dans HomeScreen:', data.slice(0, 1)); // Debug
          
          // Adapter les données pour inclure le champ time s'il existe
          const adaptedData = data.map((apt: any) => ({
            ...apt,
            // S'assurer que le champ time est préservé
            time: apt.time || apt.appointmentTime || null,
            service: apt.service || {
              id: apt.serviceId?.toString() ?? '',
              name: apt.serviceName ?? '',
              price: Number(apt.price) ?? 0,
              duration: apt.duration ?? 0,
              description: '',
              category: '',
              imageUrl: '',
            },
          }));
          
          setAppointments(adaptedData);
        } catch (e) {
          setAppointments([]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    const fetchServices = async () => {
      if (user && token) {
        try {
          const data = await getAllServices(token);
          console.log('Services récupérés:', data); // Debug: voir la structure des données
          console.log('Premier service:', data[0]); // Debug: voir le premier service
          setServices(data);
        } catch (e) {
          console.error('Erreur lors de la récupération des services:', e);
        }
      }
    };
    
    const fetchNotifications = async () => {
      if (user && token) {
        try {
          const data = await getUserNotifications(token);
          setNotifications(data);
        } catch (e) {
          console.error('Erreur lors de la récupération des notifications:', e);
        }
      }
    };
    
    fetchAppointments();
    fetchServices();
    fetchNotifications();
  }, [user, token]);
  
  // Mettre à jour la semaine actuelle lorsqu'on change la date sélectionnée
  React.useEffect(() => {
    if (viewMode === 'month') {
      // Quand on sélectionne une date en mode mois, mettre à jour la semaine pour qu'elle corresponde
      const newWeekStart = new Date(selectedDate);
      const day = newWeekStart.getDay();
      // Ajuster au début de la semaine (lundi)
      const diff = newWeekStart.getDate() - day + (day === 0 ? -6 : 1);
      newWeekStart.setDate(diff);
      setCurrentWeekStartDate(newWeekStart);
    }
  }, [selectedDate, viewMode]);

  // Fonction pour naviguer entre les semaines ou les mois
  const navigateWeek = (direction: 'prev' | 'next') => {
    if (viewMode === 'week') {
      // Navigation par semaine
      const newStartDate = new Date(currentWeekStartDate);
      newStartDate.setDate(currentWeekStartDate.getDate() + (direction === 'next' ? 7 : -7));
      setCurrentWeekStartDate(newStartDate);
      
      // Mettre à jour la date sélectionnée au premier jour de la nouvelle semaine
      const newSelectedDate = new Date(newStartDate);
      setSelectedDate(newSelectedDate);
    } else {
      // Navigation par mois
      const newSelectedDate = new Date(selectedDate);
      const currentMonth = selectedDate.getMonth();
      const currentYear = selectedDate.getFullYear();
      
      // Calculer le nouveau mois
      if (direction === 'next') {
        // Aller au mois suivant
        newSelectedDate.setMonth(currentMonth + 1);
      } else {
        // Aller au mois précédent
        newSelectedDate.setMonth(currentMonth - 1);
      }
      
      // Mettre à jour la date sélectionnée au 1er du nouveau mois
      newSelectedDate.setDate(1);
      setSelectedDate(newSelectedDate);
      
      // Mettre également à jour la date de début de semaine
      const newWeekStart = new Date(newSelectedDate);
      const day = newWeekStart.getDay();
      // Ajuster au début de la semaine (lundi)
      const diff = newWeekStart.getDate() - day + (day === 0 ? -6 : 1);
      newWeekStart.setDate(diff);
      setCurrentWeekStartDate(newWeekStart);
    }
  };

  // Fonction pour générer les jours selon le mode d'affichage
  const generateDays = (): (Date | null)[] => {
    if (viewMode === 'week') {
      // Vue semaine: 7 jours à partir du début de semaine
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(currentWeekStartDate);
        d.setDate(currentWeekStartDate.getDate() + i);
        return d;
      });
    } else {
      // Vue mois: tous les jours du mois courant
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      
      // Obtenir le jour de la semaine du 1er du mois (0 = dimanche, 1 = lundi, etc.)
      let firstDayOfWeek = firstDay.getDay();
      // Ajuster pour commencer par lundi
      firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
      
      // Jours de la semaine pour l'en-tête (L, M, M, J, V, S, D)
      // Nous ne les incluons pas dans le tableau car maintenant nous les affichons séparément
      
      // Ajouter des jours vides au début pour aligner les jours
      const emptyStartDays = Array.from({ length: firstDayOfWeek }, () => null);
      
      // Ajouter tous les jours du mois
      const monthDays: (Date | null)[] = [];
      for (let i = 1; i <= daysInMonth; i++) {
        monthDays.push(new Date(year, month, i));
      }
      
      // Compléter la dernière semaine avec des jours vides si nécessaire
      const totalDaysAdded = firstDayOfWeek + daysInMonth;
      const remainingDays = totalDaysAdded % 7;
      const emptyEndDays = remainingDays > 0 ? Array.from({ length: 7 - remainingDays }, () => null) : [];
      
      return [...emptyStartDays, ...monthDays, ...emptyEndDays];
    }
  };
  
  const days = generateDays();

  // Créneaux horaires exemple (matin)
  const morningSlots = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00'];

  // Date actuelle pour la mettre en évidence
  const today = new Date();
  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  // Fonction pour vérifier si un jour a des rendez-vous et obtenir le statut
  const getDayAppointmentStatus = (date: Date) => {
    const dayAppointments = appointments.filter(a => {
      const appDate = new Date(a.date);
      return appDate.toDateString() === date.toDateString();
    });
    
    if (dayAppointments.length === 0) return null;
    
    // Priorité : confirmé > en attente > autres statuts
    const hasConfirmed = dayAppointments.some(a => a.status === 'confirmed');
    const hasPending = dayAppointments.some(a => a.status === 'pending');
    
    if (hasConfirmed) return 'confirmed';
    if (hasPending) return 'pending';
    return 'other';
  };

  // Filtrer les rendez-vous du jour sélectionné
  const appointmentsOfDay = appointments.filter(a => {
    const appDate = new Date(a.date);
    return appDate.toDateString() === selectedDate.toDateString();
  });

  // Calculer les statistiques des rendez-vous
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(a => {
    const appDate = new Date(a.date);
    return appDate < today && a.status === 'confirmed';
  }).length;
  const upcomingAppointments = appointments.filter(a => {
    const appDate = new Date(a.date);
    return appDate >= today;
  }).length;

  // Fonction pour supprimer une notification
  const removeNotification = async (id: string) => {
    try {
      if (user && token) {
        await deleteNotification(id, token);
      }
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      // Supprimer localement même en cas d'erreur API
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }
  };

  // Définir un type pour les activités du prestataire
  type ProviderActivity = {
    id: string;
    type: string;
    message: string;
    time: string;
    icon: string;
    imageUrl?: string;
    serviceData?: Service;
  };

  // Fonction pour construire l'URL de l'image
  const getServiceImageUrl = (service: Service): string | null => {
    if (service.image && service.image !== 'null' && service.image !== '') {
      // Utiliser la route API spécifique pour récupérer l'image par ID de service
      const imageUrl = `${API_URL}/services/${service.id}/image`;
      console.log('🖼️ URL d\'image construite:', imageUrl);
      console.log('📋 Service complet:', JSON.stringify(service, null, 2));
      return imageUrl;
    }
    console.log('❌ Pas d\'image valide pour:', service.name, 'image value:', service.image);
    return null;
  };

  // Générer les activités du prestataire basées sur les services récents
  const getProviderActivities = (): ProviderActivity[] => {
    const activities: ProviderActivity[] = [];
    
    // Services récemment ajoutés (simulé - dans une vraie app, les services auraient une date de création)
    const recentServices = services.slice(0, 2);
    recentServices.forEach((service, index) => {
      console.log(`Service ${index}:`, service); // Debug: voir chaque service
      console.log(`Image du service ${service.name}:`, service.image); // Debug: voir l'image
      
      // Construire l'URL complète de l'image
      const imageUrl = getServiceImageUrl(service);
      console.log(`URL construite pour ${service.name}:`, imageUrl); // Debug: voir l'URL construite
      
      activities.push({
        id: `service-${service.id}`,
        type: 'new_service',
        message: `Nouveau service: ${service.name}`,
        time: index === 0 ? '1h' : '2j',
        icon: '✨',
        imageUrl: imageUrl || `https://picsum.photos/200/200?random=${service.id}`, // Fallback avec image aléatoire
        serviceData: service // Garder les données complètes du service
      });
    });
    
    // Ajouter quelques activités génériques si pas assez de services
    if (activities.length < 3) {
      activities.push({
        id: 'schedule-update',
        type: 'schedule',
        message: 'Horaires étendus le samedi jusqu\'à 19h',
        time: '3j',
        icon: '⏰'
      });
    }
    
    if (activities.length < 3) {
      activities.push({
        id: 'team-update',
        type: 'team',
        message: 'Nouvelle esthéticienne rejoint l\'équipe',
        time: '1sem',
        icon: '👩‍💼'
      });
    }
    
    return activities.slice(0, 3); // Limiter à 3 activités
  };

  // Fonction pour formater le temps relatif
  const formatRelativeTime = (isoDate: string) => {
    if (!isoDate) return 'récemment';
    
    try {
      const now = new Date();
      const date = new Date(isoDate);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) return 'récemment';
      
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);
      
      if (diffInHours < 1) return 'À l\'instant';
      if (diffInHours < 24) return `${diffInHours}h`;
      if (diffInDays < 7) return `${diffInDays}j`;
      return `${Math.floor(diffInDays / 7)}sem`;
    } catch (error) {
      console.warn('Erreur lors du formatage de la date:', isoDate, error);
      return 'récemment';
    }
  };

  // Fonction pour obtenir l'icône selon le type de notification
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'promo': return '🎉';
      case 'system': return 'ℹ️';
      default: return '🔔';
    }
  };

  // Fonctions pour la gestion de la réservation rapide
  
  // Ouvrir la popup de réservation pour une date sélectionnée
  const openBookingModal = () => {
    setBookingStep('service');
    setSelectedService(null);
    setShowBookingModal(true);
  };

  // Sélectionner un service et passer à l'étape suivante
  const selectService = async (service: Service) => {
    setSelectedService(service);
    setBookingStep('time');
    setLoadingSlots(true);
    
    try {
      // Générer les créneaux par défaut adaptés à la durée du service
      const defaultSlots = generateDefaultTimeSlotsForService(service);
      
      // Vérifier la disponibilité de chaque créneau individuellement
      const dateString = selectedDate.toISOString().split('T')[0];
      const slotsWithAvailability = await Promise.all(
        defaultSlots.map(async (slot) => {
          try {
            const availability = await checkTimeSlotAvailability(dateString, slot.time);
            return {
              ...slot,
              available: availability?.available !== false // Si l'API ne répond pas, considérer comme disponible
            };
          } catch (error) {
            console.log(`Erreur pour le créneau ${slot.time}, considéré comme disponible`);
            return {
              ...slot,
              available: true // En cas d'erreur, considérer comme disponible
            };
          }
        })
      );
      
      setAvailableSlots(slotsWithAvailability);
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
      // Utiliser les créneaux par défaut avec disponibilité par défaut
      setAvailableSlots(generateDefaultTimeSlotsForService(service));
    } finally {
      setLoadingSlots(false);
    }
  };

  // Générer des créneaux par défaut selon la durée d'un service spécifique
  const generateDefaultTimeSlotsForService = (service: Service) => {
    const serviceDuration = service.duration;
    let timeSlots: string[] = [];

    if (serviceDuration >= 60) {
      // Service de 60 min ou plus : créneaux d'1 heure
      timeSlots = [
        '08:00', '09:00', '10:00', '11:00',
        '14:00', '15:00', '16:00', '17:00'
      ];
    } else if (serviceDuration <= 30) {
      // Service de 30 min ou moins : créneaux de 30 min
      timeSlots = [
        '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
      ];
    } else {
      // Service entre 30 et 60 min : créneaux de 45 min
      timeSlots = [
        '08:15', '09:00', '09:45', '10:30', '11:15',
        '14:00', '14:45', '15:30', '16:15', '17:00'
      ];
    }
    
    return timeSlots.map(time => ({ 
      time, 
      available: true, 
      period: parseInt(time.split(':')[0]) < 12 ? 'morning' : 'afternoon' 
    }));
  };

  // Générer des créneaux par défaut (cas général)
  const generateDefaultTimeSlots = () => {
    // Créneaux par défaut de 30 min si aucun service sélectionné
    const timeSlots = [
      '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
    ];
    
    return timeSlots.map(time => ({ 
      time, 
      available: true, 
      period: parseInt(time.split(':')[0]) < 12 ? 'morning' : 'afternoon' 
    }));
  };

  // Confirmer la réservation
  const confirmBooking = async (timeSlot: string) => {
    if (!selectedService || !user || !token) {
      console.error('❌ Données manquantes:', { selectedService: !!selectedService, user: !!user, token: !!token });
      return;
    }
    
    // Vérifications supplémentaires
    if (!user.firstName || !user.email || !selectedService.id) {
      console.error('❌ Champs utilisateur ou service manquants:', {
        firstName: user.firstName,
        email: user.email,
        serviceId: selectedService.id
      });
      return;
    }
    
    try {
      // Format de données selon l'API: CreateAppointmentRequest
      const appointmentData: CreateAppointmentRequest = {
        clientName: `${user.firstName} ${user.lastName || ''}`.trim(), // Nom complet du client
        clientEmail: user.email, // Email du client
        serviceId: selectedService.id, // ID du service
        date: selectedDate.toISOString().split('T')[0], // Date au format YYYY-MM-DD
        time: timeSlot, // Heure au format HH:MM
        clientPhone: (user as any).phone || '', // Téléphone du client (optionnel)
        notes: '', // Notes optionnelles
        createdBy: String(user.id || user.email) // ID ou email de l'utilisateur qui crée
      };
      
      console.log('📅 Données du rendez-vous à envoyer:', appointmentData); // Debug
      console.log('📋 Service sélectionné:', selectedService); // Debug
      console.log('👤 Utilisateur:', user); // Debug
      
      await createAppointment(appointmentData, token);
      
      // Fermer la popup et rafraîchir les données
      setShowBookingModal(false);
      setSelectedService(null);
      
      // Rafraîchir les rendez-vous
      const updatedAppointments = await getUserAppointments(token);
      setAppointments(updatedAppointments);
      
      console.log('✅ Rendez-vous créé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la création du rendez-vous:', error);
    }
  };

  // Fermer la popup
  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedService(null);
    setBookingStep('service');
  };

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
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
      >
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.titleSection}>
          <Text style={[styles.appName, isDarkMode && styles.appNameDark]}>
            Bienvenue chez <Text style={[styles.appName, isDarkMode && styles.appNameDark]}>ServiceBooking</Text> {user ? (user.firstName || '') : ''}!
          </Text>
          <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>Gérer facilement vos rendez-vous de chez votre prestataire ❤️</Text>
        </View>
        <TouchableOpacity
          style={[styles.themeModeButton, isDarkMode && styles.themeModeButtonDark]}
          onPress={toggleTheme}
        >
          <Ionicons 
            name={isDarkMode ? "sunny-outline" : "moon-outline"}
            size={24} 
            color="#4F8EF7"
          />
        </TouchableOpacity>
      </View>
      
      {/* Section des statistiques des rendez-vous */}
      {user && (
        <View style={[styles.statsSection, isDarkMode && styles.statsSectionDark]}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalAppointments}</Text>
            <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryDark]}>Rendez-vous</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedAppointments}</Text>
            <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryDark]}>Complétés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{upcomingAppointments}</Text>
            <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryDark]}>À venir</Text>
          </View>
        </View>
      )}

  {/*Section calendriers */}

      <Card style={[styles.card, isDarkMode && styles.cardDark]}>
        <Card.Content style={isDarkMode && styles.cardContentDark}>
          {/* En-tête de l'agenda avec titre, mois, boutons de navigation et mode */}
          <View style={styles.calendarHeader}>
            <View style={styles.calendarTitleContainer}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                📅 Agenda {viewMode === 'week' ? 'Semaine' : 'Mois'}
              </Text>
            </View>
            <View style={styles.calendarControls}>
              <TouchableOpacity 
                style={[styles.viewModeButton, isDarkMode && styles.viewModeButtonDark]} 
                onPress={() => {
                  // Animation du bouton avant le changement
                  Animated.sequence([
                    Animated.timing(calendarOpacity, {
                      toValue: 0.7,
                      duration: 100,
                      useNativeDriver: true,
                    }),
                    Animated.timing(calendarOpacity, {
                      toValue: 1,
                      duration: 100,
                      useNativeDriver: true,
                    })
                  ]).start();
                  
                  setViewMode(viewMode === 'week' ? 'month' : 'week');
                }}
                activeOpacity={0.8}
              >
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Ionicons 
                    name={viewMode === 'week' ? 'calendar-outline' : 'calendar'} 
                    size={20} 
                    color={isDarkMode ? "#FFFFFF" : "#4F8EF7"} 
                  />
                  <Text style={{
                    marginLeft: 4,
                    color: isDarkMode ? "#FFFFFF" : "#4F8EF7",
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                    {viewMode === 'week' ? 'Mois' : 'Semaine'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Navigation et vue du calendrier */}
          <Animated.View style={{
            flex: 1,
            height: calendarHeight,
            overflow: 'visible' // Changé de 'hidden' à 'visible' pour éviter de couper les jours
          }}>
            <Animated.View style={{
              flex: 1,
              opacity: calendarOpacity,
              marginBottom: 10, // Réduit de 20 à 10 pour moins d'espace avant le texte
            }}>
              {viewMode === 'week' ? (
                <View>
                  {/* Boutons de navigation au-dessus */}
                  <View style={styles.weekNavigationButtons}>
                    <TouchableOpacity 
                      onPress={() => navigateWeek('prev')} 
                      style={[styles.navButton, isDarkMode && styles.navButtonDark]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-back-circle" size={20} color="#4F8EF7" />
                    </TouchableOpacity>
                    
                    <Text style={[styles.currentMonthText, isDarkMode && styles.currentMonthTextDark]}>
                      {currentWeekStartDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </Text>
                    
                    <TouchableOpacity 
                      onPress={() => navigateWeek('next')} 
                      style={[styles.navButton, isDarkMode && styles.navButtonDark]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-forward-circle" size={20} color="#4F8EF7" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Zone de swipe dédiée aux dates */}
                  <FlatList
                    data={days}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(d, index) => d ? d.toDateString() : `empty-${index}`}
                    renderItem={({ item }) => {
                      if (!item) return null;
                      
                      const appointmentStatus = getDayAppointmentStatus(item);
                      
                      return (
                        <TouchableOpacity
                          style={[
                            styles.dayButton, 
                            isDarkMode && styles.dayButtonDark,
                            isToday(item) && styles.todayButton,
                            item.toDateString() === selectedDate.toDateString() && styles.dayButtonSelected
                          ]}
                          onPress={() => setSelectedDate(item)}
                        >
                          <Text style={[
                            styles.dayLabel,
                            isDarkMode && styles.textDark,
                            item.toDateString() === selectedDate.toDateString() && { color: '#fff' }
                          ]}>
                            {item.toLocaleDateString('fr-FR', { weekday: 'short' })}
                          </Text>
                          <View style={styles.dayNumberContainer}>
                            <Text style={[
                              styles.dayNumber,
                              isDarkMode && styles.dayNumberDark,
                              item.toDateString() === selectedDate.toDateString() && { color: '#fff' }
                            ]}>{item.getDate()}</Text>
                            {appointmentStatus && (
                              <View style={[
                                styles.appointmentDot,
                                appointmentStatus === 'confirmed' && styles.appointmentDotConfirmed,
                                appointmentStatus === 'pending' && styles.appointmentDotPending,
                                appointmentStatus === 'other' && styles.appointmentDotOther
                              ]} />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                    contentContainerStyle={styles.daysContainer}
                  />
                </View>
              ) : (
                // Vue par mois - Vue en grille
                <View style={[styles.monthViewContainer, isDarkMode && styles.monthViewContainerDark]}>
                  {/* Navigation des mois directement dans le conteneur du calendrier */}
                  <View style={styles.monthNavigation}>
                    <TouchableOpacity 
                      onPress={() => navigateWeek('prev')} 
                      style={[styles.monthNavButton, isDarkMode && styles.navButtonDark]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-back-circle" size={20} color={isDarkMode ? "#60A5FA" : "#4F8EF7"} />
                    </TouchableOpacity>
                    
                    <Text style={[styles.currentMonthText, isDarkMode && styles.currentMonthTextDark]}>
                      {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </Text>
                    
                    <TouchableOpacity 
                      onPress={() => navigateWeek('next')} 
                      style={[styles.monthNavButton, isDarkMode && styles.navButtonDark]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-forward-circle" size={20} color={isDarkMode ? "#60A5FA" : "#4F8EF7"} />
                    </TouchableOpacity>
                  </View>

                  {/* En-tête avec les noms des jours de la semaine */}
                  <View style={styles.weekDaysHeader}>
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dayName, index) => (
                      <View key={`header-${index}`} style={styles.dayNameHeader}>
                        <Text style={[styles.dayNameText, isDarkMode && styles.dayNameTextDark]}>{dayName}</Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* Jours du mois organisés en grille */}
                  <Animated.View style={[
                    styles.monthGrid,
                    isDarkMode && styles.monthGridDark,
                    {
                      transform: [{ scale: monthGridScale }],
                      opacity: monthGridScale
                    }
                  ]}>
                    {(() => {
                      // Récupérer tous les jours à afficher (jours du mois + jours vides)
                      const allDays = days; // Plus besoin de slice car on n'a plus les 7 jours d'en-tête
                      
                      // Diviser en lignes de 7 jours (semaines)
                      const weeks = [];
                      for (let i = 0; i < allDays.length; i += 7) {
                        weeks.push(allDays.slice(i, i + 7));
                      }
                      
                      return weeks.map((week, weekIndex) => (
                        <View key={`week-${weekIndex}`} style={styles.weekRow}>
                          {week.map((dayItem, dayIndex) => {
                            if (dayItem === null) {
                              return (
                                <View 
                                  key={`empty-${weekIndex}-${dayIndex}`} 
                                  style={[styles.monthViewDayButton, styles.monthViewEmptyDay]} 
                                />
                              );
                            }
                            
                            return (
                              <TouchableOpacity
                                key={dayItem.toDateString()}
                                style={[
                                  styles.monthViewDayButton,
                                  isDarkMode && styles.monthViewDayButtonDark,
                                  isToday(dayItem) && styles.monthViewTodayButton,
                                  dayItem.toDateString() === selectedDate.toDateString() && styles.monthViewDayButtonSelected
                                ]}
                                onPress={() => setSelectedDate(dayItem)}
                              >
                                <View style={styles.dayNumberContainer}>
                                  <Text style={[
                                    styles.monthViewDayLabel,
                                    isDarkMode && styles.monthViewDayLabelDark,
                                    isToday(dayItem) && styles.monthViewTodayText,
                                    dayItem.toDateString() === selectedDate.toDateString() && styles.monthViewSelectedDayText
                                  ]}>
                                    {dayItem.getDate()}
                                  </Text>
                                  {(() => {
                                    const appointmentStatus = getDayAppointmentStatus(dayItem);
                                    return appointmentStatus && (
                                      <View style={[
                                        styles.appointmentDot,
                                        appointmentStatus === 'confirmed' && styles.appointmentDotConfirmed,
                                        appointmentStatus === 'pending' && styles.appointmentDotPending,
                                        appointmentStatus === 'other' && styles.appointmentDotOther
                                      ]} />
                                    );
                                  })()}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ));
                    })()}
                  </Animated.View>
                </View>
              )}
            </Animated.View>
            </Animated.View>
            
            
          {/* Affichage des rendez-vous du jour sélectionné */}
          {!user ? (
            <View style={{ alignItems: 'center', marginTop: 32 }}> {/* Augmenté de 24 à 32 */}
              <Text style={{ fontSize: 16, color: '#d32f2f', marginBottom: 12, textAlign: 'center' }}>
                Veuillez vous connecter afin de voir vos rendez-vous
              </Text>
              <Button
                mode="contained"
                style={[styles.button, isDarkMode && styles.buttonDark]}
                labelStyle={[isDarkMode && styles.buttonTextDark]}
              onPress={() => navigation.navigate('AuthTab' as never)}
              >
                Se connecter
              </Button>
            </View>
          ) : (
            <View style={{ marginTop: 16 }}> {/* Réduit de 24 à 16 pour moins d'espace */}
              {appointmentsOfDay.length === 0 ? (
                <>
                  <Text style={{ textAlign: 'center', color: '#888', fontSize: 15 }}>
                    Aucun rendez-vous
                  </Text>
                  <Button
                    mode="contained"
                    style={[
                      styles.button, 
                      { alignSelf: 'center', marginTop: 4, paddingHorizontal: 8, paddingVertical: 2 }, // Encore plus réduit
                      isDarkMode && styles.buttonDark
                    ]}
                    labelStyle={[isDarkMode && styles.buttonTextDark, { fontSize: 11 }]} // Taille de texte encore plus petite
                    onPress={openBookingModal}
                  >
                    Prendre un rendez-vous
                  </Button>
                </>
              ) : (
                <View style={styles.appointmentSimpleView}>
                  <TouchableOpacity 
                    style={styles.appointmentBadgeWithButton}
                    onPress={() => navigation.navigate('AppointmentsTab')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.appointmentBadgeContent}>
                      <Ionicons name="calendar-outline" size={22} color="#fff" style={styles.appointmentIcon} />
                      <Text style={styles.appointmentText}>
                        {appointmentsOfDay.length === 1 ? 'Vous avez un rendez-vous ce jour ! ' : `Vous avez ${appointmentsOfDay.length} rendez-vous ce jour`}
                      </Text>
                    </View>
                    <View style={styles.badgeDivider} />
                    <View style={styles.viewMoreSection}>
                      <Text style={styles.viewMoreButtonText}>Voir plus</Text>
                      <Ionicons name="chevron-forward-circle" size={18} color="#fff" style={{marginLeft: 6}} />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
      
      {/* Section Aperçu des activités du prestataire */}
      {user && services.length > 0 && (
        <Card style={[styles.card, isDarkMode && styles.cardDark]}>
          <Card.Content style={isDarkMode && styles.cardContentDark}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              👁️ Aperçu
            </Text>
            {getProviderActivities().map((activity, index) => (
              <View key={activity.id} style={[styles.activityItem, isDarkMode && styles.borderBottomDark]}>
                {activity.imageUrl && activity.imageUrl !== 'null' ? (
                  <Image 
                    source={{ uri: activity.imageUrl }} 
                    style={styles.activityImage}
                    onError={(error) => {
                      console.log('❌ Erreur image URL:', activity.imageUrl);
                      console.log('❌ Erreur détails:', JSON.stringify(error.nativeEvent, null, 2));
                      console.log('❌ Service:', activity.serviceData?.name);
                    }}
                    onLoad={() => {
                      console.log('✅ Image chargée:', activity.imageUrl);
                    }}
                  />
                ) : (
                  <View style={[styles.activityImagePlaceholder, isDarkMode && styles.activityImagePlaceholderDark]}>
                    <Text style={styles.activityIcon}>{activity.icon}</Text>
                  </View>
                )}
                <View style={styles.activityContent}>
                  <Text style={[styles.activityMessage, isDarkMode && styles.activityMessageDark]}>{activity.message}</Text>
                  {activity.serviceData && (
                    <Text style={[styles.activityServicePrice, isDarkMode && styles.activityServicePriceDark]}>
                      {activity.serviceData.price || 0}€ • {activity.serviceData.duration || 0} min
                    </Text>
                  )}
                  <Text style={[styles.activityTime, isDarkMode && styles.activityTimeDark]}>Il y a {activity.time || 'récemment'}</Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Section Notifications */}
      {user && (
        <Card style={[styles.card, isDarkMode && styles.cardDark]}>
          <Card.Content style={isDarkMode && styles.cardContentDark}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              🔔 Notifications
            </Text>
            {notifications.length === 0 ? (
              <Text style={[styles.noNotificationsText, isDarkMode && styles.noNotificationsTextDark]}>Aucune notification</Text>
            ) : (
              notifications.map((notification) => (
                <View key={notification.id} style={[styles.notificationItem, isDarkMode && styles.notificationItemDark]}>
                  <Text style={styles.notificationIcon}>{getNotificationIcon(notification.type)}</Text>
                  <View style={styles.notificationContent}>
                    <Text style={[styles.notificationMessage, isDarkMode && styles.notificationMessageDark]}>{notification.message || 'Notification'}</Text>
                    <Text style={[styles.notificationTime, isDarkMode && styles.notificationTimeDark]}>Il y a {formatRelativeTime(notification.createdAt) || 'récemment'}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => removeNotification(notification.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      )}
            
    </ScrollView>
    
    {/* Popup de réservation rapide */}
    <Modal
      visible={showBookingModal}
      animationType="slide"
      transparent={true}
      onRequestClose={closeBookingModal}
    >
      <View style={[styles.modalOverlay, isDarkMode && styles.modalOverlayDark]}>
        <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
          
          {/* En-tête du modal */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>
              {bookingStep === 'service' ? 'Choisir un service' : `Choisir un créneau`}
            </Text>
            <TouchableOpacity onPress={closeBookingModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDarkMode ? "#fff" : "#333"} />
            </TouchableOpacity>
          </View>
          
          {/* Date sélectionnée */}
          <View style={[styles.selectedDateBanner, isDarkMode && styles.selectedDateBannerDark]}>
            <Ionicons name="calendar" size={20} color="#4F8EF7" />
            <Text style={[styles.selectedDateText, isDarkMode && styles.selectedDateTextDark]}>
              {selectedDate.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          {bookingStep === 'service' ? (
            /* Étape 1 : Sélection du service */
            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[styles.serviceOptionCard, isDarkMode && styles.serviceOptionCardDark]}
                  onPress={() => selectService(service)}
                >
                  {getServiceImageUrl(service) ? (
                    <Image 
                      source={{ uri: getServiceImageUrl(service)! }} 
                      style={styles.serviceOptionImage}
                    />
                  ) : (
                    <View style={[styles.serviceOptionImage, styles.serviceOptionImagePlaceholder]}>
                      <Text style={{ fontSize: 20 }}>📷</Text>
                    </View>
                  )}
                  <View style={styles.serviceOptionContent}>
                    <Text style={[styles.serviceOptionName, isDarkMode && styles.serviceOptionNameDark]}>
                      {service.name || 'Service'}
                    </Text>
                    <Text style={[styles.serviceOptionDescription, isDarkMode && styles.serviceOptionDescriptionDark]} numberOfLines={2}>
                      {service.description || 'Description du service'}
                    </Text>
                    <View style={styles.serviceOptionFooter}>
                      <Text style={[styles.serviceOptionPrice, isDarkMode && styles.serviceOptionPriceDark]}>
                        {service.price || 0}€
                      </Text>
                      <Text style={[styles.serviceOptionDuration, isDarkMode && styles.serviceOptionDurationDark]}>
                        {service.duration || 0} min
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={isDarkMode ? "#9CA3AF" : "#666"} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            /* Étape 2 : Sélection du créneau */
            <View>
              {/* Service sélectionné */}
              {selectedService && (
                <View style={[styles.selectedServiceBanner, isDarkMode && styles.selectedServiceBannerDark]}>
                  <TouchableOpacity 
                    onPress={() => setBookingStep('service')}
                    style={styles.backButton}
                  >
                    <Ionicons name="chevron-back" size={20} color="#4F8EF7" />
                  </TouchableOpacity>
                  <View style={styles.selectedServiceContent}>
                    <Text style={[styles.selectedServiceName, isDarkMode && styles.selectedServiceNameDark]}>
                      {selectedService.name || 'Service sélectionné'}
                    </Text>
                    <Text style={[styles.selectedServicePrice, isDarkMode && styles.selectedServicePriceDark]}>
                      {selectedService.price || 0}€ • {selectedService.duration || 0} min
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Note explicative sur les créneaux */}
              {selectedService && (
                <View style={[styles.timeSlotInfo, isDarkMode && styles.timeSlotInfoDark]}>
                  <Ionicons name="information-circle" size={16} color={isDarkMode ? "#60A5FA" : "#4F8EF7"} />
                  <Text style={[styles.timeSlotInfoText, isDarkMode && styles.timeSlotInfoTextDark]}>
                    {(selectedService.duration || 30) >= 60 
                      ? "Créneaux d'1 heure adaptés à ce service"
                      : (selectedService.duration || 30) <= 30 
                        ? "Créneaux de 30 min adaptés à ce service"
                        : "Créneaux de 45 min adaptés à ce service"
                    }
                  </Text>
                </View>
              )}
              
              {/* Créneaux horaires */}
              <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                {loadingSlots ? (
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
                      Chargement des créneaux...
                    </Text>
                  </View>
                ) : (
                  <View>
                    {/* Créneaux du matin */}
                    <Text style={[styles.periodTitle, isDarkMode && styles.periodTitleDark]}>🌅 Matin</Text>
                    <View style={styles.timeButtonsContainer}>
                      {availableSlots
                        .filter(slot => slot.period === 'morning')
                        .map((slot) => (
                          <TouchableOpacity
                            key={slot.time}
                            style={[
                              styles.timeButton,
                              isDarkMode && styles.timeButtonDark,
                              !slot.available && styles.timeButtonDisabled
                            ]}
                            onPress={() => confirmBooking(slot.time)}
                            disabled={!slot.available}
                          >
                            <Text style={[
                              styles.timeButtonText,
                              isDarkMode && styles.timeButtonTextDark,
                              !slot.available && styles.timeButtonTextDisabled
                            ]}>
                              {slot.time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                    
                    {/* Créneaux de l'après-midi */}
                    <Text style={[styles.periodTitle, isDarkMode && styles.periodTitleDark]}>🌇 Après-midi</Text>
                    <View style={styles.timeButtonsContainer}>
                      {availableSlots
                        .filter(slot => slot.period === 'afternoon')
                        .map((slot) => (
                          <TouchableOpacity
                            key={slot.time}
                            style={[
                              styles.timeButton,
                              isDarkMode && styles.timeButtonDark,
                              !slot.available && styles.timeButtonDisabled
                            ]}
                            onPress={() => confirmBooking(slot.time)}
                            disabled={!slot.available}
                          >
                            <Text style={[
                              styles.timeButtonText,
                              isDarkMode && styles.timeButtonTextDark,
                              !slot.available && styles.timeButtonTextDisabled
                            ]}>
                              {slot.time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  monthGridDark: {
    backgroundColor: '#1F2937',
  },
  monthViewDayButtonDark: {
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100, // Espace pour éviter que la tabBar cache le contenu
  },
  containerDark: {
    backgroundColor: '#111827', // gray-900
  },
  headerDark: {
    backgroundColor: '#111827', // gray-900 - Même couleur que le container dark
  },
  welcomeSectionDark: {
    backgroundColor: '#111827', // gray-900 - Même couleur que le container dark
  },
  appNameDark: {
    color: '#60A5FA', // Bleu plus clair pour le mode sombre
  },
  brandHighlightDark: {
    backgroundColor: '#60A5FA',
    color: '#111827',
  },
  headerSubtitleDark: {
    color: '#9CA3AF', // gray-400
  },
  cardDark: {
    backgroundColor: '#1F2937', // gray-800
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardContentDark: {
    backgroundColor: '#1F2937', // gray-800
  },
  statsSectionDark: {
    backgroundColor: '#1F2937', // gray-800
  },
  monthViewContainerDark: {
    backgroundColor: '#1F2937', // gray-800 - Même couleur que les cards en mode sombre
  },
  buttonDark: {
    backgroundColor: '#60A5FA', // Même couleur que le thème principal en mode sombre
  },
  buttonTextDark: {
    color: '#fff',
  },
  sectionTitleDark: {
    color: '#fff',
  },
  textDark: {
    color: '#fff',
  },
  textSecondaryDark: {
    color: '#9CA3AF', // gray-400
  },
  borderDark: {
    borderColor: '#374151', // gray-700
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa', // Même couleur que le container
  },
  welcomeSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa', // Même couleur que le container
    marginBottom: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F8EF7',
  },
  brandHighlight: {
    backgroundColor: '#4F8EF7',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleSection: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  welcome: {
    fontSize: 20,
    fontWeight: '600',
  },
  themeModeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ebf3ff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e0e9f7',
  },
  themeModeButtonDark: {
    backgroundColor: '#374151', // gray-700
    borderColor: '#4B5563', // gray-600
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  calendarTitleContainer: {
    flex: 1,
  },
  monthLabel: {
    fontSize: 15,
    color: '#555',
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  monthLabelDark: {
    color: '#9CA3AF', // gray-400
  },
  calendarControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeButton: {
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#ebf3ff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#e0e9f7',
  },
  viewModeButtonDark: {
    backgroundColor: '#374151', // gray-700
    borderColor: '#4B5563', // gray-600
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  weekNavigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  navButton: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f7f9fc',
    marginHorizontal: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  navButtonDark: {
    backgroundColor: '#374151', // gray-700
  },
  monthViewEmptyDay: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    opacity: 0.4,
  },
  monthViewContainer: {
    flexDirection: 'column',
    backgroundColor: '#fff', // Même couleur que les cards
    borderRadius: 12,
    padding: 12, // Réduit de 20 à 12
    paddingTop: 8, // Réduit de 12 à 8
    paddingBottom: 16, // Plus d'espace en bas pour éviter le débordement
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'stretch',
    width: '100%',
    minHeight: 280, // Hauteur minimale pour contenir tous les jours
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Réduit de 16 à 12
    paddingHorizontal: 8,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f7f9fc',
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
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8, // Réduit de 10 à 8
    width: '100%',
    gap: 8, // Réduit de 12 à 8 pour correspondre aux weekRow
  },
  monthGrid: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6, // Réduit de 8 à 6 pour éviter le débordement
    width: '100%',
    gap: 8, // Réduit de 12 à 8 pour plus d'espace
  },
  monthViewDayButton: {
    width: 36, // Légèrement réduit de 40 à 36 pour plus d'espace
    height: 36, // Légèrement réduit de 40 à 36 pour plus d'espace
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  dayNameHeader: {
    width: 36, // Ajusté pour correspondre aux boutons de jours
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6, // Réduit de 8 à 6
  },
  dayNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  dayNameTextDark: {
    color: '#9CA3AF', // gray-400
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
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4F8EF7', // Même couleur que le thème principal
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
    letterSpacing: 0.3,
  },
  daysContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingVertical: 10, // Augmenté de 6 à 10 pour plus d'espace vertical
  },
  dayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 25,
    backgroundColor: '#f7f9fc',
    marginHorizontal: 6,
    minWidth: 60, // Augmenté de 56 à 60
    height: 64, // Augmenté de 56 à 64 pour plus d'espace
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dayButtonDark: {
    backgroundColor: '#374151', // gray-700
  },
  // Style spécifique pour les jours sélectionnés dans la vue mensuelle
  dayButtonSelected: {
    backgroundColor: '#4F8EF7',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  todayButton: {
    backgroundColor: '#e8f1ff',
  },
  todayText: {
    color: '#4F8EF7',
    fontWeight: '600',
  },
  emptyDay: {
    width: 40,
  },
  disabledDay: {
    opacity: 0.3,
  },
  dayLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
    fontWeight: '500',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  dayNumberDark: {
    color: '#fff',
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
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    height: 40,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4F8EF7',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  activityMessageDark: {
    color: '#fff',
  },
  activityTime: {
    fontSize: 13,
    color: '#666',
  },
  activityTimeDark: {
    color: '#9CA3AF', // gray-400
  },
  activityImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  activityImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityServicePrice: {
    fontSize: 12,
    color: '#4F8EF7',
    fontWeight: '600',
    marginBottom: 2,
  },
  activityServicePriceDark: {
    color: '#60A5FA', // Un bleu plus clair pour le mode sombre
  },
  activityImagePlaceholderDark: {
    backgroundColor: '#374151', // gray-700
  },
  borderBottomDark: {
    borderBottomColor: '#374151', // gray-700
  },
  noNotificationsTextDark: {
    color: '#9CA3AF', // gray-400
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationItemDark: {
    borderBottomColor: '#374151', // gray-700
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessageDark: {
    color: '#fff',
  },
  notificationTime: {
    fontSize: 13,
    color: '#666',
  },
  notificationTimeDark: {
    color: '#9CA3AF', // gray-400
  },
  removeButton: {
    padding: 4,
  },
  noNotificationsText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 15,
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  appointmentSimpleView: {
    alignItems: 'center',
    paddingVertical: 8, // Réduit de 16 à 8 pour moins d'espace vertical
    paddingHorizontal: 8,
  },
  appointmentBadge: {
    backgroundColor: '#4F8EF7',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#4F8EF7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 14,
    width: '100%',
  },
  appointmentBadgeWithButton: {
    backgroundColor: '#4F8EF7',
    borderRadius: 10,
    shadowColor: '#4F8EF7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    width: '100%',
    overflow: 'hidden',
  },
  appointmentBadgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8, // Réduit de 12 à 8 pour un badge plus compact
  },
  badgeDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },
  viewMoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.08)',
    padding: 6, // Réduit de 10 à 6 pour une section plus compacte
  },
  appointmentIcon: {
    marginRight: 10,
  },
  appointmentText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
  },
  viewMoreButton: {
    backgroundColor: '#4F8EF7', // Même couleur que les autres boutons
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  viewMoreButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  monthViewTodayButton: {
    backgroundColor: '#e8f1ff',
  },
  monthViewTodayText: {
    color: '#4F8EF7',
    fontWeight: '600',
  },
  monthViewDayButtonSelected: {
    backgroundColor: '#4F8EF7',
  },
  monthViewSelectedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  dayNumberContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  appointmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: -2,
    right: -8,
  },
  appointmentDotConfirmed: {
    backgroundColor: '#10B981', // green-500
  },
  appointmentDotPending: {
    backgroundColor: '#F59E0B', // orange-500
  },
  appointmentDotOther: {
    backgroundColor: '#6B7280', // gray-500
  },
  // Styles pour la popup de réservation
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayDark: {
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '85%', // Augmenté de 80% à 85%
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalContentDark: {
    backgroundColor: '#1F2937',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalTitleDark: {
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  selectedDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  selectedDateBannerDark: {
    backgroundColor: '#1E3A5F',
  },
  selectedDateText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedDateTextDark: {
    color: '#fff',
  },
  modalScrollContent: {
    maxHeight: 500, // Augmenté de 400 à 500 pour plus d'espace
    flexGrow: 1, // Permet au contenu de grandir
  },
  serviceOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  serviceOptionCardDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  serviceOptionImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  serviceOptionImagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceOptionContent: {
    flex: 1,
  },
  serviceOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceOptionNameDark: {
    color: '#fff',
  },
  serviceOptionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  serviceOptionDescriptionDark: {
    color: '#9CA3AF',
  },
  serviceOptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceOptionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F8EF7',
  },
  serviceOptionPriceDark: {
    color: '#60A5FA',
  },
  serviceOptionDuration: {
    fontSize: 14,
    color: '#666',
  },
  serviceOptionDurationDark: {
    color: '#9CA3AF',
  },
  selectedServiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedServiceBannerDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  selectedServiceContent: {
    flex: 1,
  },
  selectedServiceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedServiceNameDark: {
    color: '#fff',
  },
  selectedServicePrice: {
    fontSize: 14,
    color: '#4F8EF7',
    fontWeight: '600',
  },
  selectedServicePriceDark: {
    color: '#60A5FA',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  loadingTextDark: {
    color: '#9CA3AF',
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12, // Réduit de 15 à 12
    marginTop: 8, // Réduit de 10 à 8
  },
  periodTitleDark: {
    color: '#fff',
  },
  timeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 15, // Réduit de 20 à 15
    marginHorizontal: -4, // Compense les marges des boutons
  },
  timeButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 10, // Réduit de 12 à 10
    paddingHorizontal: 12,
    marginBottom: 6, // Réduit de 8 à 6
    marginHorizontal: 4, // Espacement horizontal entre les boutons
    minWidth: 75, // Largeur fixe minimum plus petite
    maxWidth: 85, // Largeur maximale pour éviter les débordements
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    flex: 0, // Empêche l'expansion automatique
  },
  timeButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  timeButtonDisabled: {
    opacity: 0.5,
  },
  timeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeButtonTextDark: {
    color: '#fff',
  },
  timeButtonTextDisabled: {
    color: '#999',
  },
  // Styles pour l'info sur les créneaux
  timeSlotInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#4F8EF7',
  },
  timeSlotInfoDark: {
    backgroundColor: '#374151',
    borderLeftColor: '#60A5FA',
  },
  timeSlotInfoText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  timeSlotInfoTextDark: {
    color: '#9CA3AF',
  },
});

export default HomeScreen;