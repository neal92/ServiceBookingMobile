import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, TextInput, Modal, ScrollView, Alert, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { ThemeContext } from '../../contexts/ThemeContext';
import { Service } from '../../types/index';
import { getAllServices, getAllCategories } from '../../api/services';
import { Loading } from '../../components/common/Loading';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { testAndShowAPIConnection } from '../../utils/networkUtils';
import { API_URL } from '../../config/api';

const ServicesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  
  // Définir la base URL pour les images
  const BASE_URL = API_URL.replace('/api', '');
  
  console.log('🔍 Configuration:', { API_URL, BASE_URL });
  
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([{ id: 'all', name: 'Tous' }]);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortOrder, setSortOrder] = useState<'price-asc' | 'price-desc' | 'duration-asc' | 'duration-desc' | 'name-asc' | 'name-desc'>('name-asc');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [createServiceStep, setCreateServiceStep] = useState(1);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    categoryId: '',
    image: null as any
  });
  const [createServiceLoading, setCreateServiceLoading] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [slideAnimation] = useState(new Animated.Value(0));

  const loadServices = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Chargement des services...');
      
      const data = await getAllServices();
      console.log('✅ Services récupérés:', data?.length || 0);
      console.log('🔍 Premier service:', data?.[0]);
      console.log('🔍 Structure des données:', JSON.stringify(data?.[0], null, 2));
      
      // Debug des images pour chaque service
      if (Array.isArray(data)) {
        console.log('🖼️ Debug des images:');
        data.forEach((service, index) => {
          console.log(`Service ${index + 1}: ${service.name}`);
          console.log(`  - ID: ${service.id}`);
          console.log(`  - imageUrl: ${service.imageUrl || 'undefined'}`);
          console.log(`  - image: ${service.image || 'undefined'}`);
          console.log(`  - Toutes les propriétés:`, Object.keys(service));
        });
        setServices(data);
      } else {
        console.warn('⚠️ Format de données inattendu:', data);
        setServices([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des services:', error);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      console.log('🔄 Chargement des catégories...');
      const data = await getAllCategories();
      console.log('✅ Catégories récupérées:', data?.length || 0);
      
      if (Array.isArray(data) && data.length > 0) {
        const formattedCategories = [
          { id: 'all', name: 'Tous' },
          ...data.map((cat: any) => ({
            id: cat.id?.toString() || 'unknown',
            name: cat.name || 'Catégorie sans nom'
          }))
        ];
        setCategories(formattedCategories);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des catégories:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadServices();
      loadCategories();
    }, [])
  );

  // Fonction pour tester l'URL d'une image
  const testImageUrl = async (url: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      console.log(`🔍 Test image URL ${url}: ${response.status}`);
      return response.ok;
    } catch (error) {
      console.log(`❌ Test image URL ${url}: ${error}`);
      return false;
    }
  };

  // Test des URLs d'images quand les services sont chargés
  useEffect(() => {
    if (services.length > 0) {
      console.log('🔍 Configuration API_URL actuelle:', API_URL);
      console.log('🔍 Base URL pour images:', BASE_URL);
      
      // Tester plusieurs chemins pour une image
      const testService = services.find(s => s.image);
      if (testService) {
        const testPaths = [
          `/uploads/${testService.image}`,
          `/images/${testService.image}`,
          `/static/${testService.image}`,
          `/api/services/${testService.id}/image`,
          `/${testService.image}`,
          `/public/uploads/${testService.image}`,
          `/storage/${testService.image}`
        ];
        
        console.log('🧪 Test de différents chemins pour:', testService.name);
        testPaths.forEach(async (path) => {
          const fullUrl = `${BASE_URL}${path}`;
          const isWorking = await testImageUrl(fullUrl);
          if (isWorking) {
            console.log('✅ CHEMIN FONCTIONNEL TROUVÉ:', path);
          }
        });
      }
    }
  }, [services]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const toggleSort = () => {
    setShowSort(!showSort);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearch('');
    }
  };

  const openServiceDetail = (service: Service) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  const closeServiceModal = () => {
    setShowServiceModal(false);
    setSelectedService(null);
  };

  const openCreateServiceModal = () => {
    setShowCreateServiceModal(true);
    setCreateServiceStep(1);
    setShowImageOptions(false);
    setShowRecap(false);
    setNewService({
      name: '',
      description: '',
      price: '',
      duration: '',
      categoryId: '',
      image: null
    });
  };

  const closeCreateServiceModal = () => {
    setShowCreateServiceModal(false);
    setCreateServiceStep(1);
    setShowImageOptions(false);
    setShowRecap(false);
    setNewService({
      name: '',
      description: '',
      price: '',
      duration: '',
      categoryId: '',
      image: null
    });
  };

  const nextStep = () => {
    console.log('🔄 nextStep called - Current step:', createServiceStep);
    const newStep = createServiceStep + 1;
    console.log('🔄 Moving to step:', newStep);
    setCreateServiceStep(newStep);
  };

  const prevStep = () => {
    console.log('🔄 prevStep called - Current step:', createServiceStep);
    const newStep = createServiceStep - 1;
    console.log('🔄 Moving to step:', newStep);
    setCreateServiceStep(newStep);
  };

  const proceedToImageChoice = () => {
    setShowImageOptions(true);
  };

  const skipImage = () => {
    setShowImageOptions(false);
    setShowRecap(true);
  };

  const handleImagePicker = async (source: 'camera' | 'gallery') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission requise', 'Permission d\'accès à la galerie requise pour ajouter une image');
      return;
    }

    if (source === 'camera') {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.granted === false) {
        Alert.alert('Permission requise', 'Permission d\'accès à la caméra requise');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewService(prev => ({...prev, image: result.assets[0]}));
      setShowImageOptions(false);
      setShowRecap(true);
    }
  };

  const launchCamera = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (cameraPermission.granted === false) {
      Alert.alert('Permission requise', 'Permission d\'accès à la caméra requise');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewService(prev => ({...prev, image: result.assets[0]}));
      setShowImageOptions(false);
      setShowRecap(true);
    }
  };

  const editField = (field: string) => {
    setShowRecap(false);
    setShowImageOptions(false);
    // Aller à l'étape correspondant au champ
    switch (field) {
      case 'name':
        setCreateServiceStep(1);
        break;
      case 'description':
        setCreateServiceStep(2);
        break;
      case 'price':
        setCreateServiceStep(3);
        break;
      case 'duration':
        setCreateServiceStep(4);
        break;
      case 'categoryId':
        setCreateServiceStep(5);
        break;
    }
  };

  const createService = async () => {
    if (!newService.name.trim() || !newService.price || !newService.duration || !newService.categoryId) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreateServiceLoading(true);
    try {
      // Créer FormData pour envoyer l'image
      const formData = new FormData();
      formData.append('name', newService.name.trim());
      formData.append('description', newService.description.trim());
      formData.append('price', newService.price);
      formData.append('duration', newService.duration);
      formData.append('categoryId', newService.categoryId);

      // Ajouter l'image si elle existe
      if (newService.image) {
        const imageUri = newService.image.uri;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);
      }

      console.log('🔄 Création du service...');

      const response = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorData}`);
      }

      const result = await response.json();
      console.log('✅ Service créé:', result);

      // Recharger la liste des services
      await loadServices();
      
      // Fermer le modal
      closeCreateServiceModal();
      
      Alert.alert('Succès', 'Service créé avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de la création du service:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      Alert.alert('Erreur', `Erreur lors de la création du service: ${errorMessage}`);
    } finally {
      setCreateServiceLoading(false);
    }
  };

  // Filtrage et tri des services
  const filteredAndSortedServices = React.useMemo(() => {
    let filtered = services;

    // Debug pour le filtrage
    console.log('🔍 Filtrage - selectedCategory:', selectedCategory);
    console.log('🔍 Filtrage - services count:', services.length);
    if (services.length > 0) {
      console.log('🔍 Premier service:', {
        id: services[0].id,
        name: services[0].name,
        category: services[0].category,
        categoryId: services[0].categoryId,
        categoryName: services[0].categoryName
      });
    }

    // Filtrage par catégorie
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(service => {
        // Comparer avec l'ID de catégorie (categoryId) ou category si c'est un ID, ou categoryName si c'est un nom
        const matches = 
          service.categoryId?.toString() === selectedCategory ||
          service.category?.toString() === selectedCategory ||
          service.categoryName === selectedCategory;
        
        console.log(`🔍 Service "${service.name}": categoryId=${service.categoryId}, category=${service.category}, categoryName=${service.categoryName}, matches=${matches}`);
        return matches;
      });
      console.log('🔍 Services filtrés:', filtered.length);
    }

    // Filtrage par recherche
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(service =>
        service.name?.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower) ||
        service.category?.toLowerCase().includes(searchLower) ||
        service.categoryName?.toLowerCase().includes(searchLower)
      );
    }

    // Tri
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOrder) {
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'duration-asc':
          return (a.duration || 0) - (b.duration || 0);
        case 'duration-desc':
          return (b.duration || 0) - (a.duration || 0);
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'name-asc':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return sorted;
  }, [services, selectedCategory, search, sortOrder]);

  const formatPrice = (price: number | string | undefined | null) => {
    if (price === undefined || price === null) return 'Prix non défini';
    
    // Convertir en nombre si c'est une chaîne
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    // Vérifier si c'est un nombre valide
    if (isNaN(numPrice)) return 'Prix non défini';
    
    return `${numPrice.toFixed(2)} €`;
  };

  const formatDuration = (duration: number | string | undefined | null) => {
    if (duration === undefined || duration === null) return 'Durée non définie';
    
    // Convertir en nombre si c'est une chaîne
    const numDuration = typeof duration === 'string' ? parseInt(duration) : duration;
    
    // Vérifier si c'est un nombre valide
    if (isNaN(numDuration)) return 'Durée non définie';
    
    if (numDuration < 60) return `${numDuration} min`;
    
    const hours = Math.floor(numDuration / 60);
    const minutes = numDuration % 60;
    
    if (minutes === 0) return `${hours}h`;
    return `${hours}h${minutes.toString().padStart(2, '0')}`;
  };

  // Composant d'image intelligente qui teste plusieurs URLs
  const SmartImage = ({ service, style, placeholderStyle }: any) => {
    const [workingUrl, setWorkingUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      const findWorkingUrl = async () => {
        if (!service.image) {
          setIsLoading(false);
          return;
        }

        const possibleUrls = [
          `${BASE_URL}/uploads/${service.image}`,
          `${BASE_URL}/images/${service.image}`,
          `${BASE_URL}/static/${service.image}`,
          `${BASE_URL}/api/services/${service.id}/image`,
          `${BASE_URL}/${service.image}`,
          `${BASE_URL}/public/uploads/${service.image}`,
          `${BASE_URL}/storage/${service.image}`
        ];

        for (const url of possibleUrls) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(url, { 
              method: 'HEAD',
              signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              console.log('✅ URL d\'image fonctionnelle trouvée:', url);
              setWorkingUrl(url);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            // Continue to next URL
          }
        }

        console.log('❌ Aucune URL d\'image fonctionnelle trouvée pour:', service.name);
        setHasError(true);
        setIsLoading(false);
      };

      findWorkingUrl();
    }, [service]);

    if (isLoading) {
      return (
        <View style={placeholderStyle}>
          <Ionicons name="time-outline" size={24} color="#9CA3AF" />
          <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
            Chargement...
          </Text>
        </View>
      );
    }

    if (hasError || !workingUrl) {
      return (
        <View style={placeholderStyle}>
          <Ionicons name="image-outline" size={32} color="#9CA3AF" />
          <Text style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
            Image indisponible
          </Text>
        </View>
      );
    }

    return (
      <Image
        source={{ uri: workingUrl }}
        style={style}
        resizeMode="cover"
        onError={() => {
          console.log('❌ Erreur finale pour URL validée:', workingUrl);
          setHasError(true);
        }}
        onLoad={() => {
          console.log('✅ Image chargée avec succès:', workingUrl);
        }}
      />
    );
  };

  const renderServiceItem = ({ item }: { item: Service }) => {
    console.log('🖼️ Service:', item.name);
    console.log('🔍 imageUrl:', item.imageUrl);
    console.log('🔍 image:', item.image);
    
    return (
      <TouchableOpacity style={styles.serviceCardContainer} onPress={() => openServiceDetail(item)}>
        <Card style={[styles.serviceCard, isDarkMode && styles.serviceCardDark]}>
          <Card.Content style={styles.serviceCardContent}>
            {/* Image ou icône */}
            <View style={[styles.serviceImageContainer, isDarkMode && styles.serviceImageContainerDark]}>
              <SmartImage
                service={item}
                style={styles.serviceImage}
                placeholderStyle={[styles.serviceImagePlaceholder, isDarkMode && styles.serviceImagePlaceholderDark]}
              />
            </View>
            
            {/* Informations du service */}
            <View style={styles.serviceInfo}>
              <Title style={[styles.serviceTitle, isDarkMode && styles.serviceTitleDark]} numberOfLines={2}>
                {item.name}
              </Title>
              <Paragraph 
                style={[styles.serviceDescription, isDarkMode && styles.serviceDescriptionDark]} 
                numberOfLines={2}
              >
                {item.description}
              </Paragraph>
              
              {/* Catégorie juste sous la description */}
              {(item.categoryName || item.category) && (
                <Text style={[styles.serviceCategory, isDarkMode && styles.serviceCategoryDark]}>
                  {item.categoryName || item.category}
                </Text>
              )}
              
              {/* Prix et durée */}
              <View style={styles.serviceMeta}>
                <Text style={[styles.servicePrice, isDarkMode && styles.servicePriceDark]}>
                  {formatPrice(item.price)}
                </Text>
                <Text style={[styles.serviceDuration, isDarkMode && styles.serviceDurationDark]}>
                  {formatDuration(item.duration)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Header avec contrôles */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.titleSection}>
          <Text style={[styles.appName, isDarkMode && styles.appNameDark]}>
            ServiceBooking
          </Text>
          <Text style={[styles.headerSubtitle, isDarkMode && styles.headerSubtitleDark]}>
            Simplifiez votre gestion de rendez-vous
          </Text>
        </View>
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={[styles.controlButton, isDarkMode && styles.controlButtonDark]}
            onPress={toggleSearch}
          >
            <Ionicons 
              name={showSearch ? "close" : "search"} 
              size={20} 
              color={isDarkMode ? "#60A5FA" : "#3498db"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, isDarkMode && styles.controlButtonDark]}
            onPress={toggleFilters}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={isDarkMode ? "#60A5FA" : "#3498db"} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, isDarkMode && styles.controlButtonDark]}
            onPress={toggleSort}
          >
            <Ionicons 
              name="swap-vertical" 
              size={20} 
              color={isDarkMode ? "#60A5FA" : "#3498db"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Espacement après header */}
      <View style={{ height: 16 }} />

      {/* Barre de recherche */}
      {showSearch && (
        <View style={[styles.searchContainer, isDarkMode && styles.searchContainerDark]}>
          <TextInput
            style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
            placeholder="Rechercher un service..."
            placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
      )}

      {/* Compteur de services */}
      <View style={[styles.servicesCounter, isDarkMode && styles.servicesCounterDark]}>
        <Text style={[styles.servicesCount, isDarkMode && styles.servicesCountDark]}>
          {(filteredAndSortedServices || []).length || 0} service{(filteredAndSortedServices || []).length > 1 ? 's' : ''} disponible{(filteredAndSortedServices || []).length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Filtres de catégories */}
      {showFilters && (
        <View style={[styles.filtersSection, isDarkMode && styles.filtersSectionDark]}>
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
            <View style={styles.statusFilters}>
              {categories.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.statusFilterButton,
                    isDarkMode && styles.statusFilterButtonDark,
                    selectedCategory === item.id && styles.statusFilterButtonActive,
                  ]}
                  onPress={() => {
                    const newCategory = selectedCategory === item.id ? null : item.id;
                    console.log('🔄 Sélection catégorie:', { 
                      current: selectedCategory, 
                      clicked: item.id, 
                      name: item.name, 
                      new: newCategory 
                    });
                    setSelectedCategory(newCategory);
                  }}
                >
                  <Ionicons 
                    name="folder-outline" 
                    size={16} 
                    color={selectedCategory === item.id ? "#3498db" : (isDarkMode ? '#9CA3AF' : '#666')} 
                  />
                  <Text style={[
                    styles.statusFilterText,
                    isDarkMode && styles.statusFilterTextDark,
                    selectedCategory === item.id && { color: "#3498db", fontWeight: '600' }
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Options de tri */}
      {showSort && (
        <View style={styles.sortContainer}>
          <Text style={[styles.sortTitle, isDarkMode && styles.sortTitleDark]}>Trier par :</Text>
          <View style={styles.sortOptions}>
            {[
              { id: 'name-asc', label: 'Nom (A-Z)' },
              { id: 'name-desc', label: 'Nom (Z-A)' },
              { id: 'price-asc', label: 'Prix (croissant)' },
              { id: 'price-desc', label: 'Prix (décroissant)' },
              { id: 'duration-asc', label: 'Durée (courte)' },
              { id: 'duration-desc', label: 'Durée (longue)' }
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.sortOption,
                  isDarkMode && styles.sortOptionDark,
                  sortOrder === option.id && styles.sortOptionActive,
                  sortOrder === option.id && isDarkMode && styles.sortOptionActiveDark
                ]}
                onPress={() => setSortOrder(option.id as any)}
              >
                <Text style={[
                  styles.sortOptionText,
                  isDarkMode && styles.sortOptionTextDark,
                  sortOrder === option.id && styles.sortOptionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Bouton d'ajout de service - uniquement pour les admins */}
      {user && user.role === 'admin' && (
        <View style={[styles.addServiceSection, isDarkMode && styles.addServiceSectionDark]}>
          <TouchableOpacity
            style={[styles.addServiceButton, isDarkMode && styles.addServiceButtonDark]}
            onPress={openCreateServiceModal}
          >
            <Ionicons 
              name="add-circle" 
              size={24} 
              color="#fff" 
              style={styles.addServiceIcon}
            />
            <Text style={styles.addServiceText}>
              Ajouter un nouveau service
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Liste des services */}
      <FlatList
        data={filteredAndSortedServices}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.serviceRow}
        contentContainerStyle={styles.servicesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="cube-outline" 
              size={64} 
              color={isDarkMode ? "#4B5563" : "#D1D5DB"} 
            />
            <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
              Aucun service trouvé
            </Text>
          </View>
        }
      />

      {/* Modal de détail du service */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeServiceModal}
      >
        <SafeAreaView style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
          {selectedService && (
            <View style={styles.modalContent}>
              {/* Header du modal */}
              <View style={[styles.modalHeader, isDarkMode && styles.modalHeaderDark]}>
                <View style={styles.modalHeaderContent}>
                  <Text style={[styles.modalHeaderTitle, isDarkMode && styles.modalHeaderTitleDark]}>
                    Détail de la préstation

                  </Text>
                  <TouchableOpacity
                    style={[styles.closeButton, isDarkMode && styles.closeButtonDark]}
                    onPress={closeServiceModal}
                  >
                    <Ionicons name="close" size={24} color={isDarkMode ? "#f9fafb" : "#1f2937"} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.modalScrollView}>
                {/* Image du service en pleine largeur */}
                <View style={styles.serviceDetailImageContainer}>
                  {(() => {
                    let imageUrl = null;
                    
                    if (selectedService.imageUrl) {
                      if (selectedService.imageUrl.includes('localhost')) {
                        imageUrl = selectedService.imageUrl.replace('localhost:5000', BASE_URL.replace('http://', ''));
                      } else if (selectedService.imageUrl.startsWith('http')) {
                        imageUrl = selectedService.imageUrl;
                      } else {
                        imageUrl = `${BASE_URL}/uploads/${selectedService.imageUrl}`;
                      }
                    } else if (selectedService.image) {
                      imageUrl = `${BASE_URL}/uploads/${selectedService.image}`;
                    }

                    return imageUrl ? (
                      <Image 
                        source={{ uri: imageUrl }} 
                        style={styles.serviceDetailImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.serviceDetailImagePlaceholder, isDarkMode && styles.serviceDetailImagePlaceholderDark]}>
                        <Ionicons 
                          name="image-outline" 
                          size={80} 
                          color={isDarkMode ? "#6B7280" : "#9CA3AF"} 
                        />
                        <Text style={[styles.imagePlaceholderText, isDarkMode && styles.imagePlaceholderTextDark]}>
                          Aucune image disponible
                        </Text>
                      </View>
                    );
                  })()}
                </View>

                {/* Informations principales du service */}
                <View style={[styles.serviceDetailMainInfo, isDarkMode && styles.serviceDetailMainInfoDark]}>
                  <Text style={[styles.serviceDetailTitle, isDarkMode && styles.serviceDetailTitleDark]}>
                    {selectedService.name}
                  </Text>
                  
                  <Text style={[styles.serviceDetailDescription, isDarkMode && styles.serviceDetailDescriptionDark]}>
                    {selectedService.description}
                  </Text>

                  {/* Prix et durée avec design amélioré */}
                  <View style={styles.serviceDetailMeta}>
                    <View style={[styles.serviceDetailMetaCard, isDarkMode && styles.serviceDetailMetaCardDark]}>
                      <View style={styles.serviceDetailMetaIcon}>
                        <Ionicons name="pricetag" size={24} color="#10b981" />
                      </View>
                      <View style={styles.serviceDetailMetaContent}>
                        <Text style={[styles.serviceDetailMetaLabel, isDarkMode && styles.serviceDetailMetaLabelDark]}>
                          Prix
                        </Text>
                        <Text style={[styles.serviceDetailPrice, isDarkMode && styles.serviceDetailPriceDark]}>
                          {formatPrice(selectedService.price)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={[styles.serviceDetailMetaCard, isDarkMode && styles.serviceDetailMetaCardDark]}>
                      <View style={styles.serviceDetailMetaIcon}>
                        <Ionicons name="time" size={24} color="#3b82f6" />
                      </View>
                      <View style={styles.serviceDetailMetaContent}>
                        <Text style={[styles.serviceDetailMetaLabel, isDarkMode && styles.serviceDetailMetaLabelDark]}>
                          Durée
                        </Text>
                        <Text style={[styles.serviceDetailDuration, isDarkMode && styles.serviceDetailDurationDark]}>
                          {formatDuration(selectedService.duration)}
                        </Text>
                      </View>
                    </View>

                    {selectedService.categoryName && (
                      <View style={[styles.serviceDetailMetaCard, isDarkMode && styles.serviceDetailMetaCardDark]}>
                        <View style={styles.serviceDetailMetaIcon}>
                          <Ionicons name="folder" size={24} color="#f59e0b" />
                        </View>
                        <View style={styles.serviceDetailMetaContent}>
                          <Text style={[styles.serviceDetailMetaLabel, isDarkMode && styles.serviceDetailMetaLabelDark]}>
                            Catégorie
                          </Text>
                          <Text style={[styles.serviceDetailCategory, isDarkMode && styles.serviceDetailCategoryDark]}>
                            {selectedService.categoryName}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* Section Conditions de réservation */}
                <View style={[styles.serviceDetailSection, isDarkMode && styles.serviceDetailSectionDark]}>
                  <View style={[styles.serviceDetailSectionHeader, isDarkMode && styles.serviceDetailSectionHeaderDark]}>
                    <Ionicons name="document-text" size={24} color={isDarkMode ? "#f59e0b" : "#d97706"} />
                    <Text style={[styles.serviceDetailSectionTitle, isDarkMode && styles.serviceDetailSectionTitleDark]}>
                      Conditions de réservation
                    </Text>
                  </View>
                  
                  <View style={styles.serviceDetailSectionContent}>
                    <View style={styles.conditionItem}>
                      <Ionicons name="checkmark-circle" size={16} color={isDarkMode ? "#34d399" : "#059669"} />
                      <Text style={[styles.conditionText, isDarkMode && styles.conditionTextDark]}>
                        Réservation obligatoire à l'avance
                      </Text>
                    </View>
                    
                    <View style={styles.conditionItem}>
                      <Ionicons name="checkmark-circle" size={16} color={isDarkMode ? "#34d399" : "#059669"} />
                      <Text style={[styles.conditionText, isDarkMode && styles.conditionTextDark]}>
                        Annulation possible jusqu'à 24h avant le rendez-vous
                      </Text>
                    </View>
                    
                    <View style={styles.conditionItem}>
                      <Ionicons name="checkmark-circle" size={16} color={isDarkMode ? "#34d399" : "#059669"} />
                      <Text style={[styles.conditionText, isDarkMode && styles.conditionTextDark]}>
                        Paiement sur place ou en ligne
                      </Text>
                    </View>
                    
                    <View style={styles.conditionItem}>
                      <Ionicons name="checkmark-circle" size={16} color={isDarkMode ? "#34d399" : "#059669"} />
                      <Text style={[styles.conditionText, isDarkMode && styles.conditionTextDark]}>
                        Arrivée 5 minutes avant l'heure prévue
                      </Text>
                    </View>
                    
                    <View style={styles.conditionItem}>
                      <Ionicons name="information-circle" size={16} color={isDarkMode ? "#60a5fa" : "#3498db"} />
                      <Text style={[styles.conditionText, isDarkMode && styles.conditionTextDark]}>
                        En cas de retard, la prestation pourra être écourtée
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Bouton de réservation amélioré */}
                <View style={[styles.serviceDetailActions, isDarkMode && styles.serviceDetailActionsDark]}>
                  <TouchableOpacity 
                    style={[styles.bookButton, isDarkMode && styles.bookButtonDark]}
                    onPress={() => {
                      // TODO: Ajouter la logique de réservation plus tard
                      console.log('Réserver le service:', selectedService.name);
                      closeServiceModal();
                    }}
                  >
                    <View style={styles.bookButtonContent}>
                      <Ionicons name="calendar" size={20} color="#ffffff" style={styles.bookButtonIcon} />
                      <Text style={styles.bookButtonText}>Réserver ce service</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.contactButton, isDarkMode && styles.contactButtonDark]}
                    onPress={() => {
                      console.log('Redirection vers messagerie pour le service:', selectedService.name);
                      closeServiceModal();
                      // Redirection vers l'onglet Messagerie
                      navigation.navigate('MessagingTab' as never);
                    }}
                  >
                    <View style={styles.contactButtonContent}>
                      <Ionicons name="chatbubble" size={18} color={isDarkMode ? "#60a5fa" : "#3b82f6"} style={styles.contactButtonIcon} />
                      <Text style={[styles.contactButtonText, isDarkMode && styles.contactButtonTextDark]}>
                        Poser une question
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </SafeAreaView>
      </Modal>
      
      {/* Modal de création de service avec système d'étapes */}
      <Modal
        visible={showCreateServiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCreateServiceModal}
      >
        <View style={[styles.modalOverlay, isDarkMode && styles.modalOverlayDark]}>
          <SafeAreaView style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
            <KeyboardAvoidingView 
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              <View style={[styles.modalHeader, isDarkMode && styles.modalHeaderDark]}>
                <Text style={[styles.modalHeaderTitle, isDarkMode && styles.modalHeaderTitleDark]}>
                  {showRecap ? 'Récapitulatif' : 
                   showImageOptions ? 'Ajouter une photo' :
                   `Étape ${createServiceStep}/5`}
                </Text>
                <TouchableOpacity onPress={closeCreateServiceModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={isDarkMode ? "#fff" : "#333"} />
                </TouchableOpacity>
              </View>

              {/* Barre de progression */}
              {!showRecap && !showImageOptions && (
                <View style={[styles.progressContainer, isDarkMode && styles.progressContainerDark]}>
                  <View style={[styles.progressBar, isDarkMode && styles.progressBarDark]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(createServiceStep / 5) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.progressText, isDarkMode && styles.progressTextDark]}>
                    {createServiceStep}/5
                  </Text>
                </View>
              )}

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Récapitulatif */}
              {showRecap ? (
                <View style={styles.recapContainer}>
                  <Text style={[styles.recapTitle, isDarkMode && styles.recapTitleDark]}>
                    Votre nouveau service
                  </Text>
                  
                  {/* Image preview */}
                  {newService.image && (
                    <View style={styles.recapImageContainer}>
                      <Image 
                        source={{ uri: newService.image.uri }} 
                        style={styles.recapImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  
                  {/* Informations */}
                  <View style={styles.recapFields}>
                    <TouchableOpacity 
                      style={[styles.recapField, isDarkMode && styles.recapFieldDark]}
                      onPress={() => editField('name')}
                    >
                      <View style={styles.recapFieldContent}>
                        <Text style={[styles.recapFieldLabel, isDarkMode && styles.recapFieldLabelDark]}>Nom</Text>
                        <Text style={[styles.recapFieldValue, isDarkMode && styles.recapFieldValueDark]}>{newService.name}</Text>
                      </View>
                      <Ionicons name="create-outline" size={20} color="#4F8EF7" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.recapField, isDarkMode && styles.recapFieldDark]}
                      onPress={() => editField('description')}
                    >
                      <View style={styles.recapFieldContent}>
                        <Text style={[styles.recapFieldLabel, isDarkMode && styles.recapFieldLabelDark]}>Description</Text>
                        <Text style={[styles.recapFieldValue, isDarkMode && styles.recapFieldValueDark]}>
                          {newService.description || 'Aucune description'}
                        </Text>
                      </View>
                      <Ionicons name="create-outline" size={20} color="#4F8EF7" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.recapField, isDarkMode && styles.recapFieldDark]}
                      onPress={() => editField('price')}
                    >
                      <View style={styles.recapFieldContent}>
                        <Text style={[styles.recapFieldLabel, isDarkMode && styles.recapFieldLabelDark]}>Prix</Text>
                        <Text style={[styles.recapFieldValue, isDarkMode && styles.recapFieldValueDark]}>{newService.price}€</Text>
                      </View>
                      <Ionicons name="create-outline" size={20} color="#4F8EF7" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.recapField, isDarkMode && styles.recapFieldDark]}
                      onPress={() => editField('duration')}
                    >
                      <View style={styles.recapFieldContent}>
                        <Text style={[styles.recapFieldLabel, isDarkMode && styles.recapFieldLabelDark]}>Durée</Text>
                        <Text style={[styles.recapFieldValue, isDarkMode && styles.recapFieldValueDark]}>{newService.duration} min</Text>
                      </View>
                      <Ionicons name="create-outline" size={20} color="#4F8EF7" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.recapField, isDarkMode && styles.recapFieldDark]}
                      onPress={() => editField('categoryId')}
                    >
                      <View style={styles.recapFieldContent}>
                        <Text style={[styles.recapFieldLabel, isDarkMode && styles.recapFieldLabelDark]}>Catégorie</Text>
                        <Text style={[styles.recapFieldValue, isDarkMode && styles.recapFieldValueDark]}>
                          {categories.find(c => c.id === newService.categoryId)?.name}
                        </Text>
                      </View>
                      <Ionicons name="create-outline" size={20} color="#4F8EF7" />
                    </TouchableOpacity>
                  </View>

                  {/* Actions finales */}
                  <View style={styles.finalActions}>
                    <TouchableOpacity
                      style={[styles.finalActionButton, styles.cancelButton, isDarkMode && styles.cancelButtonDark]}
                      onPress={closeCreateServiceModal}
                    >
                      <Text style={[styles.finalActionButtonText, styles.cancelButtonText]}>
                        Annuler
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.finalActionButton, styles.validateButton, createServiceLoading && styles.validateButtonDisabled]}
                      onPress={createService}
                      disabled={createServiceLoading}
                    >
                      <Text style={[styles.finalActionButtonText, styles.validateButtonText]}>
                        {createServiceLoading ? 'Création...' : 'Valider'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : showImageOptions ? (
                /* Options d'image */
                <View style={styles.imageOptionsContainer}>
                  <Text style={[styles.imageOptionsTitle, isDarkMode && styles.imageOptionsTitleDark]}>
                    Souhaitez-vous ajouter une photo ?
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.imageOptionButton, isDarkMode && styles.imageOptionButtonDark]}
                    onPress={launchCamera}
                  >
                    <Ionicons name="camera" size={32} color="#4F8EF7" />
                    <Text style={[styles.imageOptionText, isDarkMode && styles.imageOptionTextDark]}>
                      Prendre une photo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.imageOptionButton, isDarkMode && styles.imageOptionButtonDark]}
                    onPress={() => handleImagePicker('gallery')}
                  >
                    <Ionicons name="images" size={32} color="#4F8EF7" />
                    <Text style={[styles.imageOptionText, isDarkMode && styles.imageOptionTextDark]}>
                      Choisir depuis la galerie
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.skipImageButton, isDarkMode && styles.skipImageButtonDark]}
                    onPress={skipImage}
                  >
                    <Text style={[styles.skipImageText, isDarkMode && styles.skipImageTextDark]}>
                      Passer cette étape
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Étapes du formulaire */
                <View style={styles.stepsContainer}>
                  {/* Debug info */}
                  <Text style={{color: isDarkMode ? '#fff' : '#000', fontSize: 12, textAlign: 'center', marginBottom: 10}}>
                    Étape actuelle: {createServiceStep}/5
                  </Text>
                  
                  {/* Étape 1: Nom */}
                  {createServiceStep === 1 && (
                    <View style={styles.stepContainer}>
                      <Text style={[styles.stepTitle, isDarkMode && styles.stepTitleDark]}>
                        Nom du service
                      </Text>
                      <Text style={[styles.stepDescription, isDarkMode && styles.stepDescriptionDark]}>
                        Donnez un nom clair et descriptif à votre service
                      </Text>
                      <TextInput
                        style={[styles.stepInput, isDarkMode && styles.stepInputDark]}
                        placeholder="Ex: Coupe cheveux femme"
                        placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
                        value={newService.name}
                        onChangeText={(text) => setNewService(prev => ({...prev, name: text}))}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={[styles.nextButtonCompact, !newService.name.trim() && styles.nextButtonDisabled]}
                        onPress={nextStep}
                        disabled={!newService.name.trim()}
                      >
                        <Text style={styles.nextButtonText}>Suivant</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Étape 2: Description */}
                  {createServiceStep === 2 && (
                    <View style={styles.stepContainer}>
                      <Text style={[styles.stepTitle, isDarkMode && styles.stepTitleDark]}>
                        Description
                      </Text>
                      <Text style={[styles.stepDescription, isDarkMode && styles.stepDescriptionDark]}>
                        Décrivez votre service en détail (optionnel)
                      </Text>
                      <TextInput
                        style={[styles.stepInput, styles.stepTextArea, isDarkMode && styles.stepInputDark]}
                        placeholder="Description détaillée du service..."
                        placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
                        value={newService.description}
                        onChangeText={(text) => setNewService(prev => ({...prev, description: text}))}
                        multiline
                        numberOfLines={4}
                        autoFocus
                      />
                      <View style={styles.stepActions}>
                        <TouchableOpacity style={[styles.prevButtonCompact, isDarkMode && styles.prevButtonDark]} onPress={prevStep}>
                          <Ionicons name="arrow-back" size={18} color={isDarkMode ? "#60A5FA" : "#4F8EF7"} />
                          <Text style={[styles.prevButtonText, isDarkMode && styles.prevButtonTextDark]}>Précédent</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.nextButtonCompact} onPress={nextStep}>
                          <Text style={styles.nextButtonText}>Suivant</Text>
                          <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Étape 3: Prix */}
                  {createServiceStep === 3 && (
                    <View style={styles.stepContainer}>
                      <Text style={[styles.stepTitle, isDarkMode && styles.stepTitleDark]}>
                        Prix du service
                      </Text>
                      <Text style={[styles.stepDescription, isDarkMode && styles.stepDescriptionDark]}>
                        Fixez le prix de votre service en euros
                      </Text>
                      <View style={styles.priceInputContainer}>
                        <TextInput
                          style={[styles.stepInput, styles.priceInput, isDarkMode && styles.stepInputDark]}
                          placeholder="25.50"
                          placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
                          value={newService.price}
                          onChangeText={(text) => setNewService(prev => ({...prev, price: text}))}
                          keyboardType="decimal-pad"
                          autoFocus
                        />
                        <Text style={[styles.priceSymbol, isDarkMode && styles.priceSymbolDark]}>€</Text>
                      </View>
                      <View style={styles.stepActions}>
                        <TouchableOpacity style={[styles.prevButtonCompact, isDarkMode && styles.prevButtonDark]} onPress={prevStep}>
                          <Ionicons name="arrow-back" size={18} color={isDarkMode ? "#60A5FA" : "#4F8EF7"} />
                          <Text style={[styles.prevButtonText, isDarkMode && styles.prevButtonTextDark]}>Précédent</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.nextButtonCompact, !newService.price && styles.nextButtonDisabled]}
                          onPress={nextStep}
                          disabled={!newService.price}
                        >
                          <Text style={styles.nextButtonText}>Suivant</Text>
                          <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Étape 4: Durée */}
                  {createServiceStep === 4 && (
                    <View style={styles.stepContainer}>
                      <Text style={[styles.stepTitle, isDarkMode && styles.stepTitleDark]}>
                        Durée du service
                      </Text>
                      <Text style={[styles.stepDescription, isDarkMode && styles.stepDescriptionDark]}>
                        Combien de temps dure votre service (en minutes)
                      </Text>
                      <View style={styles.durationInputContainer}>
                        <TextInput
                          style={[styles.stepInput, styles.durationInput, isDarkMode && styles.stepInputDark]}
                          placeholder="30"
                          placeholderTextColor={isDarkMode ? "#9CA3AF" : "#999"}
                          value={newService.duration}
                          onChangeText={(text) => setNewService(prev => ({...prev, duration: text}))}
                          keyboardType="number-pad"
                          autoFocus
                        />
                        <Text style={[styles.durationSymbol, isDarkMode && styles.durationSymbolDark]}>min</Text>
                      </View>
                      <View style={styles.stepActions}>
                        <TouchableOpacity style={[styles.prevButtonCompact, isDarkMode && styles.prevButtonDark]} onPress={prevStep}>
                          <Ionicons name="arrow-back" size={18} color={isDarkMode ? "#60A5FA" : "#4F8EF7"} />
                          <Text style={[styles.prevButtonText, isDarkMode && styles.prevButtonTextDark]}>Précédent</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.nextButtonCompact, !newService.duration && styles.nextButtonDisabled]}
                          onPress={nextStep}
                          disabled={!newService.duration}
                        >
                          <Text style={styles.nextButtonText}>Suivant</Text>
                          <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Étape 5: Catégorie */}
                  {createServiceStep === 5 && (
                    <View style={styles.stepContainer}>
                      <Text style={[styles.stepTitle, isDarkMode && styles.stepTitleDark]}>
                        Catégorie
                      </Text>
                      <Text style={[styles.stepDescription, isDarkMode && styles.stepDescriptionDark]}>
                        Choisissez la catégorie de votre service
                      </Text>
                      <View style={styles.categoryStepSelector}>
                        {categories.filter(cat => cat.id !== 'all').map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            style={[
                              styles.categoryStepOption,
                              isDarkMode && styles.categoryStepOptionDark,
                              newService.categoryId === category.id && styles.categoryStepOptionSelected
                            ]}
                            onPress={() => setNewService(prev => ({...prev, categoryId: category.id}))}
                          >
                            <Text style={[
                              styles.categoryStepOptionText,
                              isDarkMode && styles.categoryStepOptionTextDark,
                              newService.categoryId === category.id && styles.categoryStepOptionTextSelected
                            ]}>
                              {category.name}
                            </Text>
                            {newService.categoryId === category.id && (
                              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.stepActions}>
                        <TouchableOpacity style={[styles.prevButtonCompact, isDarkMode && styles.prevButtonDark]} onPress={prevStep}>
                          <Ionicons name="arrow-back" size={18} color={isDarkMode ? "#60A5FA" : "#4F8EF7"} />
                          <Text style={[styles.prevButtonText, isDarkMode && styles.prevButtonTextDark]}>Précédent</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.nextButtonCompact, !newService.categoryId && styles.nextButtonDisabled]}
                          onPress={proceedToImageChoice}
                          disabled={!newService.categoryId}
                        >
                          <Text style={styles.nextButtonText}>Continuer</Text>
                          <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
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
  containerDark: {
    backgroundColor: '#111827',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerDark: {
    backgroundColor: '#1f2937',
    borderBottomColor: '#374151',
  },
  titleSection: {
    flex: 1,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F8EF7',
  },
  appNameDark: {
    color: '#4F8EF7', // Garde la même couleur bleue en mode sombre
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  welcomeTextDark: {
    color: '#ccc',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  headerSubtitleDark: {
    color: '#9ca3af',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#ffffff',
  },
  searchContainerDark: {
    backgroundColor: '#1f2937',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  screenTitleDark: {
    color: '#f9fafb',
  },
  headerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  controlButtonDark: {
    backgroundColor: '#374151',
  },
  addServiceSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addServiceSectionDark: {
    // Pas de style spécifique nécessaire
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F8EF7', // Bleu comme les autres boutons
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addServiceButtonDark: {
    backgroundColor: '#3B82F6', // Bleu plus foncé en mode sombre
  },
  addServiceIcon: {
    marginRight: 8,
  },
  addServiceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  searchInputDark: {
    backgroundColor: '#374151',
    color: '#f9fafb',
  },
  servicesCounter: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  servicesCounterDark: {
    backgroundColor: '#374151',
  },
  servicesCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  servicesCountDark: {
    color: '#9ca3af',
  },
  filtersContainer: {
    marginBottom: 8,
  },
  categoriesList: {
    paddingVertical: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  categoryButtonDark: {
    backgroundColor: '#374151',
  },
  categoryButtonActive: {
    backgroundColor: '#3498db',
  },
  categoryButtonActiveDark: {
    backgroundColor: '#60a5fa',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryButtonTextDark: {
    color: '#d1d5db',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  categoryButtonTextActiveDark: {
    color: '#ffffff',
  },
  sortContainer: {
    marginBottom: 8,
  },
  sortTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sortTitleDark: {
    color: '#f9fafb',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  sortOptionDark: {
    backgroundColor: '#374151',
  },
  sortOptionActive: {
    backgroundColor: '#3498db',
  },
  sortOptionActiveDark: {
    backgroundColor: '#60a5fa',
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  sortOptionTextDark: {
    color: '#d1d5db',
  },
  sortOptionTextActive: {
    color: '#ffffff',
  },
  servicesList: {
    padding: 12, // Augmenté pour plus d'espacement
    paddingBottom: 100, // Espace supplémentaire pour éviter que la barre de navigation cache le contenu
  },
  serviceRow: {
    justifyContent: 'space-between',
    marginBottom: 8, // Espacement entre les rangées
    },
    
  serviceCardContainer: {
    flex: 1,
    marginHorizontal: 6, // Espace côté entre les cardes augmenté
    marginBottom: 12, // Espacement ligne entre les cardes augmenté
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20, // Coins encore plus arrondis
    flex: 1, // Prend toute la hauteur disponible
    minHeight: 280, // Hauteur minimale augmentée
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  serviceCardDark: {
    backgroundColor: '#1f2937',
  },
  serviceCardContent: {
    padding: 12, // Padding augmenté
    flex: 1,
    justifyContent: 'space-between', // Répartit le contenu
  },
  serviceImageContainer: {
    width: '100%',
    height: 140, // Hauteur augmentée pour l'image
    borderRadius: 16, // Plus arrondi
    marginBottom: 12, // Espacement augmenté
    overflow: 'hidden',
  },
  serviceImageContainerDark: {
    backgroundColor: '#374151',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  serviceImagePlaceholderDark: {
    backgroundColor: '#374151',
  },
  serviceInfo: {
    flex: 1,
    justifyContent: 'space-between', // Répartit le contenu verticalement
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6, // Réduit pour des cards moins hautes
    lineHeight: 20, // Ligne plus compacte
    minHeight: 40, // Hauteur minimale réduite
  },
  serviceTitleDark: {
    color: '#f9fafb',
  },
  serviceDescription: {
    fontSize: 12, // Taille réduite
    color: '#6b7280',
    marginBottom: 8, // Marge réduite
    lineHeight: 16, // Ligne plus compacte
    minHeight: 32, // Hauteur minimale réduite
    flex: 1,
  },
  serviceDescriptionDark: {
    color: '#9ca3af',
  },
  serviceMeta: {
    marginBottom: 4, // Marge réduite
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 6,
  },
  servicePriceDark: {
    color: '#34d399',
  },
  serviceDuration: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  serviceDurationDark: {
    color: '#d1d5db',
    backgroundColor: '#374151',
  },
  serviceCategory: {
    fontSize: 11,
    color: '#3498db',
    fontWeight: '500',
    marginTop: 4,
  },
  serviceCategoryDark: {
    color: '#60a5fa',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  emptyTextDark: {
    color: '#9ca3af',
  },
  // Styles pour le modal de détail
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalContainerDark: {
    backgroundColor: '#111827',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  modalHeaderDark: {
    borderBottomColor: '#374151',
    backgroundColor: '#1f2937',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalHeaderTitleDark: {
    color: '#f9fafb',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  closeButtonDark: {
    backgroundColor: '#374151',
  },
  modalScrollView: {
    flex: 1,
  },
  serviceDetailImageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#f3f4f6',
  },
  serviceDetailImage: {
    width: '100%',
    height: '100%',
  },
  serviceDetailImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  serviceDetailImagePlaceholderDark: {
    backgroundColor: '#374151',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  imagePlaceholderTextDark: {
    color: '#9ca3af',
  },
  serviceDetailMainInfo: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  serviceDetailMainInfoDark: {
    backgroundColor: '#111827',
  },
  serviceDetailContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  serviceDetailInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  serviceDetailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    lineHeight: 36,
  },
  serviceDetailTitleDark: {
    color: '#f9fafb',
  },
  serviceDetailDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 8,
  },
  serviceDetailDescriptionDark: {
    color: '#94a3b8',
  },
  serviceDetailMeta: {
    flexDirection: 'column',
    gap: 16,
    marginTop: 24,
  },
  serviceDetailMetaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  serviceDetailMetaCardDark: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
  },
  serviceDetailMetaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceDetailMetaContent: {
    flex: 1,
  },
  serviceDetailMetaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 4,
  },
  serviceDetailMetaLabelDark: {
    color: '#94a3b8',
  },
  serviceDetailMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  serviceDetailPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  serviceDetailPriceDark: {
    color: '#34d399',
  },
  serviceDetailDuration: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  serviceDetailDurationDark: {
    color: '#60a5fa',
  },
  serviceDetailCategory: {
    fontSize: 16,
    color: '#d97706',
    fontWeight: '500',
  },
  serviceDetailCategoryDark: {
    color: '#f59e0b',
  },
  serviceDetailActions: {
    padding: 20,
    paddingTop: 24,
    gap: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  serviceDetailActionsDark: {
    backgroundColor: '#111827',
    borderTopColor: '#374151',
  },
  bookButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonDark: {
    backgroundColor: '#2563eb',
  },
  bookButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonIcon: {
    marginRight: 8,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  contactButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  contactButtonDark: {
    borderColor: '#374151',
  },
  contactButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactButtonIcon: {
    marginRight: 8,
  },
  contactButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  contactButtonTextDark: {
    color: '#60a5fa',
  },
  // Styles pour les sections détaillées
  serviceDetailSection: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  serviceDetailSectionDark: {
    backgroundColor: '#2d3748', // Couleur plus foncée pour le mode sombre
  },
  serviceDetailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#e5e7eb',
    gap: 8,
  },
  serviceDetailSectionHeaderDark: {
    backgroundColor: '#2d3748', // Couleur plus foncée pour le mode sombre
  },
  serviceDetailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  serviceDetailSectionTitleDark: {
    color: '#f9fafb',
  },
  serviceDetailSectionContent: {
    padding: 16,
  },
  serviceDetailItem: {
    marginBottom: 16,
  },
  serviceDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  serviceDetailLabelDark: {
    color: '#d1d5db',
  },
  serviceDetailValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  serviceDetailValueDark: {
    color: '#f9fafb',
  },
  serviceDetailValueLong: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  serviceDetailValueLongDark: {
    color: '#d1d5db',
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  conditionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  conditionTextDark: {
    color: '#d1d5db',
  },
  // Styles pour la section filtres (comme AppointmentsScreen)
  filtersSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filtersSectionDark: {
    backgroundColor: '#1f2937',
    shadowColor: '#374151',
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  filtersTitleDark: {
    color: '#9CA3AF',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  filterLabelDark: {
    color: '#9CA3AF',
  },
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    borderColor: '#3498db',
  },
  statusFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 6,
  },
  statusFilterTextDark: {
    color: '#9CA3AF',
  },
  
  // Styles pour le modal de création de service
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputLabelDark: {
    color: '#F9FAFB',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputDark: {
    backgroundColor: '#374151',
    color: '#F9FAFB',
    borderColor: '#4B5563',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categorySelectorDark: {
    // Pas de style spécifique nécessaire
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryOptionDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  categoryOptionSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryOptionTextDark: {
    color: '#D1D5DB',
  },
  categoryOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  cancelButtonText: {
    color: '#6B7280',
  },
  createButton: {
    backgroundColor: '#10B981',
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    color: '#FFFFFF',
  },
  
  // Styles pour le système d'étapes
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
  },
  progressContainerDark: {
    backgroundColor: '#374151',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressBarDark: {
    backgroundColor: '#4B5563',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  progressTextDark: {
    color: '#9CA3AF',
  },
  stepsContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  stepSlider: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: 300,
  },
  stepContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 200,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepTitleDark: {
    color: '#F9FAFB',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  stepDescriptionDark: {
    color: '#9CA3AF',
  },
  stepInput: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  stepInputDark: {
    backgroundColor: '#374151',
    color: '#F9FAFB',
    borderColor: '#4B5563',
  },
  stepTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  priceInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 12,
    textAlign: 'right',
  },
  priceSymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10B981',
  },
  priceSymbolDark: {
    color: '#34D399',
  },
  durationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  durationInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 12,
    textAlign: 'right',
  },
  durationSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  durationSymbolDark: {
    color: '#60A5FA',
  },
  categoryStepSelector: {
    width: '100%',
    marginBottom: 24,
  },
  categoryStepOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  categoryStepOptionDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  categoryStepOptionSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#3B82F6',
  },
  categoryStepOptionText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryStepOptionTextDark: {
    color: '#D1D5DB',
  },
  categoryStepOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  stepActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  nextButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 6,
    alignSelf: 'center',
    minWidth: 120,
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  prevButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  prevButtonDark: {
    borderColor: '#4B5563',
  },
  prevButtonText: {
    color: '#4F8EF7',
    fontSize: 14,
    fontWeight: '600',
  },
  prevButtonTextDark: {
    color: '#60A5FA',
  },
  
  // Styles pour les options d'image
  imageOptionsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  imageOptionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 32,
  },
  imageOptionsTitleDark: {
    color: '#F9FAFB',
  },
  imageOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    width: '100%',
    gap: 16,
  },
  imageOptionButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  imageOptionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  imageOptionTextDark: {
    color: '#D1D5DB',
  },
  skipImageButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipImageButtonDark: {
    // Pas de style spécifique
  },
  skipImageText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  skipImageTextDark: {
    color: '#9CA3AF',
  },
  
  // Styles pour le récapitulatif
  recapContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  recapTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  recapTitleDark: {
    color: '#F9FAFB',
  },
  recapImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recapImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  recapFields: {
    marginBottom: 32,
  },
  recapField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  recapFieldDark: {
    backgroundColor: '#374151',
  },
  recapFieldContent: {
    flex: 1,
  },
  recapFieldLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  recapFieldLabelDark: {
    color: '#9CA3AF',
  },
  recapFieldValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  recapFieldValueDark: {
    color: '#F9FAFB',
  },
  finalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  finalActionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  finalActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  validateButton: {
    backgroundColor: '#10B981',
  },
  validateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  validateButtonText: {
    color: '#FFFFFF',
  },
});

export default ServicesScreen;
