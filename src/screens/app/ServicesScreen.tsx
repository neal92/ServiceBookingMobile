import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { Service } from '../../types/index';
import { getAllServices, getAllCategories } from '../../api/services';
import { Loading } from '../../components/common/Loading';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ServicesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { token, user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([{ id: 'all', name: 'Tous' }]);
  // Ajout d'un état pour la recherche
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (user && token) {
      loadServices();
      loadCategories();
    }
  }, [user, token]);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const response = await getAllServices(token || undefined);
      setServices(response);
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <Card style={[styles.card, { width: '90%', maxWidth: 400, padding: 8 }]}> 
          <Card.Content>
            <Title style={{ color: '#333' }}>OUPS !</Title>
            <Paragraph style={{ color: '#333' }}>
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
    if (!categoryId) return '';
    const cat = categories.find(c => String(c.id) === String(categoryId));
    return cat ? cat.name : '';
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <TouchableOpacity onPress={() => setShowSearch(s => !s)}>
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      {showSearch && (
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un service..."
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      )}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item.id && styles.selectedCategory
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text 
                style={[
                  styles.categoryText,
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
            <TouchableOpacity style={styles.serviceCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.serviceImage} />
              <View style={styles.serviceContent}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  <Text style={styles.servicePrice}>{item.price} €</Text>
                </View>
                {/* Affichage du nom de la catégorie associée, en couleur bleue et gras */}
                <Text style={{ color: '#3498db', fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>
                  {getCategoryName((item as ServiceWithCategoryId).categoryId) || 'Catégorie inconnue'}
                </Text>
                <Text style={styles.serviceDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.serviceFooter}>
                  <View style={styles.serviceDuration}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.serviceDurationText}>{item.duration} min</Text>
                  </View>
                  <TouchableOpacity style={styles.bookButton}>
                    <Text style={styles.bookButtonText}>Réserver</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ) : null
        }
        contentContainerStyle={styles.servicesList}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f1f1f1',
  },
  selectedCategory: {
    backgroundColor: '#3498db',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
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
});

export default ServicesScreen;
