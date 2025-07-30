import React, { useContext, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, FlatList, Image } from 'react-native';
import { Card, Title, Paragraph, Button, IconButton } from 'react-native-paper';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getUserAppointments } from '../../api/appointments';
import { getAllServices } from '../../api/services';
import { getUserNotifications, deleteNotification } from '../../api/notifications';
import { Appointment, Service, Notification } from '../../types/index';
import { AppointmentList } from '../../components/appointments/AppointmentList';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/api';

const HomeScreen = ({ navigation }: any) => {
  const { user, token } = useContext(AuthContext);
  const { theme, toggleTheme, isDarkMode } = useContext(ThemeContext);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentWeekStartDate, setCurrentWeekStartDate] = useState(() => {
    const date = new Date();
    // Ajuster au début de la semaine (lundi)
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuster quand c'est dimanche
    return new Date(date.setDate(diff));
  });

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
    const now = new Date();
    const date = new Date(isoDate);
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}j`;
    return `${Math.floor(diffInDays / 7)}sem`;
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

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.welcome, isDarkMode && styles.textDark]}>
          {user ? `Bienvenue ${user.firstName}!` : 'Bienvenue'}
        </Text>
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
            <Text style={[styles.statNumber, isDarkMode && styles.textDark]}>{completedAppointments}</Text>
            <Text style={[styles.statLabel, isDarkMode && styles.textSecondaryDark]}>Complétés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, isDarkMode && styles.textDark]}>{upcomingAppointments}</Text>
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
              <Text style={[styles.monthLabel, isDarkMode && styles.monthLabelDark]}>
                {viewMode === 'week' 
                  ? `${currentWeekStartDate.toLocaleDateString('fr-FR', { month: 'long' })} - ${
                      new Date(currentWeekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', 
                      { month: 'long', year: 'numeric' })
                    }`
                  : selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                }
              </Text>
            </View>
            <View style={styles.calendarControls}>
              <TouchableOpacity 
                style={[styles.viewModeButton, isDarkMode && styles.buttonDark]} 
                onPress={() => setViewMode(viewMode === 'week' ? 'month' : 'week')}
                activeOpacity={0.7}
              >
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Ionicons 
                    name={viewMode === 'week' ? 'calendar-outline' : 'calendar'} 
                    size={20} 
                    color={isDarkMode ? "#60A5FA" : "#4F8EF7"} 
                  />
                  <Text style={{
                    marginLeft: 4,
                    color: isDarkMode ? "#60A5FA" : "#4F8EF7",
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
          <View style={{flex: 1}}>
              {viewMode === 'week' ? (
                <View style={styles.weekNavigation}>
                  <TouchableOpacity 
                    onPress={() => navigateWeek('prev')} 
                    style={[styles.navButton, isDarkMode && styles.navButtonDark]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back-circle" size={20} color="#4F8EF7" />
                  </TouchableOpacity>
                
                  <FlatList
                    data={days}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(d, index) => d ? d.toDateString() : `empty-${index}`}
                    renderItem={({ item }) => {
                      if (!item) return null;
                      
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
                          <Text style={[
                            styles.dayNumber,
                            isDarkMode && styles.dayNumberDark,
                            item.toDateString() === selectedDate.toDateString() && { color: '#fff' }
                          ]}>{item.getDate()}</Text>
                        </TouchableOpacity>
                      );
                    }}
                    contentContainerStyle={styles.daysContainer}
                  />

                  <TouchableOpacity 
                    onPress={() => navigateWeek('next')} 
                    style={[styles.navButton, isDarkMode && styles.navButtonDark]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward-circle" size={20} color="#4F8EF7" />
                  </TouchableOpacity>
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
                  <View style={styles.monthGrid}>
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
                                  isToday(dayItem) && styles.monthViewTodayButton,
                                  dayItem.toDateString() === selectedDate.toDateString() && styles.monthViewDayButtonSelected
                                ]}
                                onPress={() => setSelectedDate(dayItem)}
                              >
                                <Text style={[
                                  styles.monthViewDayLabel,
                                  isDarkMode && styles.monthViewDayLabelDark,
                                  isToday(dayItem) && styles.monthViewTodayText,
                                  dayItem.toDateString() === selectedDate.toDateString() && styles.monthViewSelectedDayText
                                ]}>
                                  {dayItem.getDate()}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ));
                    })()}
                  </View>
                </View>
              )}
            </View>
            
            
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
              {appointmentsOfDay.length === 0 ? (
                <>
                  <Text style={{ textAlign: 'center', color: '#888', fontSize: 15 }}>
                    Aucun rendez-vous
                  </Text>
                  <Button
                    mode="contained"
                    style={[
                      styles.button, 
                      { alignSelf: 'center', marginTop: 12 },
                      isDarkMode && styles.buttonDark
                    ]}
                    labelStyle={isDarkMode && styles.buttonTextDark}
                    onPress={() => navigation.navigate('ServicesTab')}
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
                      {activity.serviceData.price}€ • {activity.serviceData.duration} min
                    </Text>
                  )}
                  <Text style={[styles.activityTime, isDarkMode && styles.activityTimeDark]}>Il y a {activity.time}</Text>
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
                    <Text style={[styles.notificationMessage, isDarkMode && styles.notificationMessageDark]}>{notification.message}</Text>
                    <Text style={[styles.notificationTime, isDarkMode && styles.notificationTimeDark]}>Il y a {formatRelativeTime(notification.createdAt)}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => removeNotification(notification.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      )}
            
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  containerDark: {
    backgroundColor: '#111827', // gray-900
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
    backgroundColor: '#1F2937', // gray-800
  },
  buttonDark: {
    backgroundColor: '#374151', // gray-700
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
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
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
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
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
    backgroundColor: '#fdfdfd',
    borderRadius: 12,
    padding: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    alignSelf: 'stretch',
    width: '100%',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 10,
    width: '100%',
    gap: 12,
  },
  monthGrid: {
    flexDirection: 'column',
    width: '100%',
    alignItems: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
    gap: 12,
  },
  monthViewDayButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  dayNameHeader: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
    letterSpacing: 0.3,
  },
  daysContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingVertical: 6,
  },
  dayButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 25,
    backgroundColor: '#f7f9fc',
    marginHorizontal: 6,
    minWidth: 56,
    height: 56,
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
    paddingVertical: 16,
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
    padding: 12,
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
    padding: 10,
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
    backgroundColor: '#1a73e8',
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
});

export default HomeScreen;