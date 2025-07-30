import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Service } from '../../types/index';
import { Appointment } from '../../types/index';
import { getAllServices, getAllCategories } from '../../api/services';
import { createAppointment, getAvailableTimeSlots, checkTimeSlotAvailability, getUserAppointments } from '../../api/appointments';
import { Loading } from '../../components/common/Loading';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { testAndShowAPIConnection } from '../../utils/networkUtils';
import { API_URL } from '../../config/api';

const ServicesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([{ id: 'all', name: 'Tous' }]);
  // Ajout d'un état pour la recherche
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
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

  // Fonction pour charger les rendez-vous
  const loadAppointments = async () => {
    if (!user || !token) return;
    
    try {
      console.log('🔄 Chargement des rendez-vous...');
      const data = await getUserAppointments(token);
      
      console.log('📦 Données brutes reçues de l\'API:');
      console.log(JSON.stringify(data, null, 2));
      
      // Analyser chaque rendez-vous individuellement
      if (Array.isArray(data)) {
        console.log(`📊 ${data.length} rendez-vous reçus de l'API`);
        
        data.forEach((appointment, index) => {
          console.log(`\n--- Rendez-vous ${index + 1} ---`);
          console.log('📅 ID:', appointment?.id);
          console.log('📅 Date:', appointment?.date);
          console.log('📅 Status:', appointment?.status);
          console.log('🔧 Service (type):', typeof appointment?.service);
          console.log('🔧 Service (contenu):', appointment?.service);
          
          if (appointment?.service) {
            console.log('  📋 Service ID:', appointment.service.id);
            console.log('  📋 Service name:', appointment.service.name);
            console.log('  📋 Service complet:', JSON.stringify(appointment.service, null, 2));
          } else {
            console.warn('⚠️ Aucun service trouvé pour ce rendez-vous');
          }
        });
        
        // Filtrer les rendez-vous invalides
        const validAppointments = data.filter((appointment, index) => {
          if (!appointment) {
            console.warn(`❌ Rendez-vous ${index} est null`);
            return false;
          }
          if (!appointment.service) {
            console.warn(`❌ Rendez-vous ${index} sans service:`, appointment);
            return false;
          }
          if (!appointment.service?.name) {
            console.warn(`❌ Service ${index} sans nom. Service:`, appointment.service);
            return false;
          }
          
          console.log(`✅ Rendez-vous ${index} valide`);
          return true;
        });
        
        console.log(`✅ ${validAppointments.length} rendez-vous valides sur ${data.length}`);
        setAppointments(validAppointments);
      } else {
        console.warn('❌ Les données reçues ne sont pas un tableau:', typeof data, data);
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
    if (!selectedService) return;
    
    setLoadingSlots(true);
    try {
      const dateString = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
      
      // Générer les créneaux par défaut basés sur la durée du service
      const defaultSlots = getDefaultTimeSlots();
      
      // Vérifier la disponibilité de chaque créneau avec la nouvelle API
      const slotsWithAvailability = await Promise.all(
        defaultSlots.map(async (slot) => {
          try {
            const availabilityCheck = await checkTimeSlotAvailability(dateString, slot.time);
            
            // Logique de disponibilité améliorée
            let isAvailable = true; // Par défaut disponible
            
            if (availabilityCheck && typeof availabilityCheck.available === 'boolean') {
              isAvailable = availabilityCheck.available;
            } else if (availabilityCheck && availabilityCheck.available === 'false') {
              isAvailable = false;
            }
            
            return {
              ...slot,
              available: isAvailable
            };
          } catch (error) {
            // En cas d'erreur, considérer le créneau comme disponible
            return {
              ...slot,
              available: true
            };
          }
        })
      );
      
      setAvailableSlots(slotsWithAvailability);
    } catch (error: any) {
      console.log('Erreur lors du chargement des créneaux, utilisation des créneaux par défaut:', error.message);
      // En cas d'erreur générale, utiliser les créneaux par défaut (tous disponibles)
      setAvailableSlots(getDefaultTimeSlots());
    } finally {
      setLoadingSlots(false);
    }
  };

  // Créneaux par défaut si l'API ne répond pas
  const getDefaultTimeSlots = () => {
    if (!selectedService) return [];
    
    const duration = selectedService.duration;
    let timeSlots: string[] = [];
    
    if (duration >= 60) {
      // Pour les services d'1h ou plus : créneaux d'1h (9h, 10h, 11h, 14h, 15h, 16h)
      timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    } else {
      // Pour les services de moins d'1h : créneaux de 30min
      timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    }
    
    return timeSlots.map(time => ({ 
      time, 
      available: true, 
      period: parseInt(time.split(':')[0]) < 12 ? 'morning' : 'afternoon' 
    }));
  };

  // Effet pour charger les créneaux quand la date ou le service change
  useEffect(() => {
    if (selectedService && showBookingModal) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, selectedService, showBookingModal]);

  useEffect(() => {
    if (user && token) {
      // Afficher l'URL de l'API utilisée pour le débogage
      console.log('URL API utilisée dans ServicesScreen:', API_URL);
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
      console.log('Chargement des services avec token:', token ? 'Présent' : 'Non présent');
      const response = await getAllServices(token || undefined);
      console.log('Services chargés avec succès, nombre:', response.length);
      setServices(response);
    } catch (error: any) {
      console.error('Erreur lors du chargement des services:', error);
      // Si l'erreur est due à un timeout, proposer de tester la connexion
      const errorMsg = error?.message || '';
      if (errorMsg.includes('timeout') || errorMsg.includes('trop de temps')) {
        Alert.alert(
          'Erreur de connexion',
          'Impossible de charger les services. Voulez-vous tester la connexion au serveur?',
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

  // Fonction pour gérer la réservation d'un service
  const handleBookService = (service: Service) => {
    console.log('Réservation du service:', service.name);
    setSelectedService(service);
    setShowCalendarModal(true); // Ouvrir d'abord le calendrier
  };

  // Fonction pour gérer la sélection de date dans le calendrier
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowCalendarModal(false); // Fermer le calendrier
    setShowBookingModal(true); // Ouvrir le modal de sélection d'heure
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

  // Fonction pour confirmer et créer la réservation
  const confirmBooking = async () => {
    if (!selectedService || !user || !token) {
      Alert.alert('Erreur', 'Informations manquantes pour la réservation');
      return;
    }

    try {
      setIsLoading(true);
      
      // Préparer les données selon le format attendu par l'API
      const appointmentData = {
        clientName: `${user.firstName} ${user.lastName || ''}`.trim() || 'Client',
        email: user.email,
        serviceId: selectedService.id, // Garder comme string
        date: selectedDate.toISOString().split('T')[0], // Format YYYY-MM-DD
        time: selectedTime, // Format HH:MM
        ...(clientNotes.trim() && { notes: clientNotes.trim() }), // Ajouter notes seulement si non vide
      };

      // Vérification que tous les champs requis sont présents
      if (!appointmentData.clientName || !appointmentData.email || !appointmentData.serviceId || !appointmentData.date || !appointmentData.time) {
        console.error('Champs manquants:', {
          clientName: !!appointmentData.clientName,
          email: !!appointmentData.email,
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
        email: appointmentData.email, 
        serviceId: appointmentData.serviceId,
        date: appointmentData.date,
        time: appointmentData.time
      });
      const newAppointment = await createAppointment(appointmentData, token);
      
      Alert.alert(
        'Réservation confirmée !',
        `Votre rendez-vous pour "${selectedService.name}" a été réservé pour le ${selectedDate.toLocaleDateString('fr-FR')} à ${selectedTime}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowBookingModal(false);
              setSelectedService(null);
              setClientNotes(''); // Réinitialiser les notes
              loadAppointments(); // Recharger les rendez-vous pour mettre à jour le calendrier
              // Optionnel: naviguer vers l'écran des rendez-vous
              // navigation.navigate('AppointmentsTab');
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
  };

  // Debug temporaire pour voir les valeurs de service.category et des catégories
  useEffect(() => {
    if (services.length > 0) {
      console.log('DEBUG services:', services.map(s => ({ id: s.id, name: s.name, category: s.category })));
    }
    if (categories.length > 0) {
      console.log('DEBUG categories:', categories);
    }
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
              Veuillez vous connecter pour voir les services disponibles.
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
      console.log('🖼️ ServicesScreen - URL d\'image construite:', imageUrl);
      return imageUrl;
    }
    console.log('❌ ServicesScreen - Pas d\'image valide pour:', service.name, 'image value:', service.image);
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

  // Trouver le nom de la catégorie à partir de l'id
  const getCategoryName = (categoryId: number | null | undefined) => {
    if (!categoryId) return 'Catégorie inconnue';
    const cat = categories.find(c => String(c.id) === String(categoryId));
    return cat ? cat.name : 'Catégorie inconnue';
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Services</Text>
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
      <View style={[styles.categoryContainer, isDarkMode && styles.categoryContainerDark]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                isDarkMode && styles.categoryButtonDark,
                selectedCategory === item.id && styles.selectedCategory
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text 
                style={[
                  styles.categoryText,
                  isDarkMode && styles.categoryTextDark,
                  selectedCategory === item.id && styles.selectedCategoryText
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryList}
        />
      </View>
      <FlatList
        data={filteredServices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          item ? (
            <TouchableOpacity style={[styles.serviceCard, isDarkMode && styles.serviceCardDark]}>
              {getServiceImageUrl(item) ? (
                <Image 
                  source={{ uri: getServiceImageUrl(item)! }} 
                  style={styles.serviceImage}
                  onError={(error) => {
                    console.log('❌ ServicesScreen - Erreur image pour:', item.name, 'URL:', getServiceImageUrl(item));
                    console.log('❌ ServicesScreen - Détails erreur:', JSON.stringify(error.nativeEvent, null, 2));
                  }}
                  onLoad={() => {
                    console.log('✅ ServicesScreen - Image chargée:', getServiceImageUrl(item));
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
                  <Text style={{ fontSize: 24 }}>📷</Text>
                </View>
              )}
              <View style={styles.serviceContent}>
                <View style={styles.serviceInfo}>
                  <Text style={[styles.serviceName, isDarkMode && styles.serviceNameDark]}>{item.name}</Text>
                  <Text style={[styles.servicePrice, isDarkMode && styles.servicePriceDark]}>{item.price} €</Text>
                </View>
                {/* Affichage du nom de la catégorie associée, en couleur bleue et gras */}
                <Text style={{ 
                  color: isDarkMode ? '#60A5FA' : '#3498db', 
                  fontWeight: 'bold', 
                  fontSize: 13, 
                  marginBottom: 4 
                }}>
                  {getCategoryName((item as ServiceWithCategoryId).categoryId)}
                </Text>
                <Text style={[styles.serviceDescription, isDarkMode && styles.serviceDescriptionDark]} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.serviceFooter}>
                  <View style={styles.serviceDuration}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.serviceDurationText}>{item.duration} min</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.bookButton}
                    onPress={() => handleBookService(item)}
                  >
                    <Text style={styles.bookButtonText}>Réserver</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ) : null
        }
        contentContainerStyle={styles.servicesList}
      />

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
            <View style={styles.calendarHeader}>
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
            <View style={styles.calendarContainer}>
              {/* En-tête des jours de la semaine */}
              <View style={styles.weekDaysHeader}>
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((dayName, index) => (
                  <View key={`header-${index}`} style={styles.dayNameHeader}>
                    <Text style={styles.dayNameText}>{dayName}</Text>
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
                              isToday(dayItem) && styles.todayButton,
                              dayItem.toDateString() === selectedDate.toDateString() && styles.dayButtonSelected,
                              isPast && styles.pastDayButton
                            ]}
                            onPress={() => !isPast && handleDateSelect(dayItem)}
                            disabled={isPast}
                          >
                            <Text style={[
                              styles.calendarDayText,
                              dayItem.toDateString() === selectedDate.toDateString() && styles.selectedDayText,
                              isPast && styles.pastDayText
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

            {/* Bouton fermer */}
            <TouchableOpacity 
              style={styles.closeCalendarButton}
              onPress={() => setShowCalendarModal(false)}
            >
              <Text style={styles.closeCalendarText}>Fermer</Text>
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
        <View style={[styles.modalOverlay, isDarkMode && styles.modalOverlayDark]}>
          <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Choisir un créneau</Text>
            
            {selectedService && (
              <View style={styles.serviceInfoModal}>
                <Text style={styles.serviceNameModal}>{selectedService.name}</Text>
                <Text style={styles.servicePriceModal}>{selectedService.price}€ • {selectedService.duration} min</Text>
                <Text style={styles.serviceDescModal}>{selectedService.description}</Text>
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

            {/* Sélection de l'heure */}
            <View style={styles.timeSection}>
              <Text style={styles.sectionLabel}>Créneaux disponibles</Text>
              
              {loadingSlots ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Chargement des créneaux...</Text>
                </View>
              ) : (
                <>
                  {/* Créneaux du matin */}
                  <View style={styles.timePeriodSection}>
                    <View style={styles.timePeriodHeader}>
                      <Ionicons name="sunny-outline" size={20} color="#f39c12" />
                      <Text style={styles.timePeriodTitle}>Matin (9h - 12h)</Text>
                    </View>
                    <View style={styles.timeButtonsContainer}>
                      {(availableSlots.length > 0 ? availableSlots : getDefaultTimeSlots())
                        .filter((slot: any) => {
                          const hour = parseInt(slot.time.split(':')[0]);
                          return hour >= 9 && hour < 12;
                        })
                        .map((slot: any, index: number) => (
                          <TouchableOpacity
                            key={`morning-${index}`}
                            style={[
                              styles.timeButton,
                              selectedTime === slot.time && styles.timeButtonSelected,
                              !slot.available && styles.timeButtonDisabled
                            ]}
                            onPress={() => slot.available && setSelectedTime(slot.time)}
                            disabled={!slot.available}
                          >
                            <Text style={[
                              styles.timeButtonText,
                              selectedTime === slot.time && styles.timeButtonTextSelected,
                              !slot.available && styles.timeButtonTextDisabled
                            ]}>
                              {slot.time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>

                  {/* Créneaux de l'après-midi */}
                  <View style={styles.timePeriodSection}>
                    <View style={styles.timePeriodHeader}>
                      <Ionicons name="partly-sunny-outline" size={20} color="#e67e22" />
                      <Text style={styles.timePeriodTitle}>Après-midi (14h - 17h)</Text>
                    </View>
                    <View style={styles.timeButtonsContainer}>
                      {(availableSlots.length > 0 ? availableSlots : getDefaultTimeSlots())
                        .filter((slot: any) => {
                          const hour = parseInt(slot.time.split(':')[0]);
                          return hour >= 14 && hour < 17;
                        })
                        .map((slot: any, index: number) => (
                          <TouchableOpacity
                            key={`afternoon-${index}`}
                            style={[
                              styles.timeButton,
                              selectedTime === slot.time && styles.timeButtonSelected,
                              !slot.available && styles.timeButtonDisabled
                            ]}
                            onPress={() => slot.available && setSelectedTime(slot.time)}
                            disabled={!slot.available}
                          >
                            <Text style={[
                              styles.timeButtonText,
                              selectedTime === slot.time && styles.timeButtonTextSelected,
                              !slot.available && styles.timeButtonTextDisabled
                            ]}>
                              {slot.time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                </>
              )}
            </View>

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
                onPress={confirmBooking}
                disabled={isLoading}
              >
                <Text style={styles.confirmButtonText}>
                  {isLoading ? 'Réservation...' : 'Confirmer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,  // Augmenté de 16 à 20
    paddingVertical: 12,    // Augmenté de 8 à 12
    borderRadius: 24,       // Augmenté de 20 à 24
    marginRight: 12,        // Augmenté de 10 à 12
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
    fontSize: 16,           // Augmenté de 14 à 16
    color: '#444',          // Couleur plus foncée pour une meilleure lisibilité
    fontWeight: '500',      // Ajout d'un poids de police plus important
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  servicesList: {
    padding: 16,
  },
  serviceCard: {
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
  serviceImage: {
    width: '100%',
    height: 150,
  },
  serviceContent: {
    padding: 16,
  },
  serviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  servicePrice: {
    fontSize: 18,
    color: '#3498db',
    fontWeight: 'bold',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDurationText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  bookButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  timePeriodSection: {
    marginBottom: 20,
  },
  timePeriodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timePeriodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
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
  closeCalendarButton: {
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  closeCalendarText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
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
  modalOverlayDark: {
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContentDark: {
    backgroundColor: '#1F2937', // gray-800
  },
  calendarModalContentDark: {
    backgroundColor: '#1F2937', // gray-800
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
});

export default ServicesScreen;
