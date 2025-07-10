import React, { useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { AuthContext } from '../../contexts/AuthContext';

const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useContext(AuthContext);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Bonjour, {user?.firstName}!</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName.charAt(0)}{user?.lastName?.charAt(0) || ''}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Mes rendez-vous</Title>
          <Paragraph>Consultez vos rendez-vous à venir ou planifiez un nouveau rendez-vous.</Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('Appointments')}>
            Voir mes rendez-vous
          </Button>
        </Card.Actions>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Services disponibles</Title>
          <Paragraph>Découvrez tous les services proposés par nos professionnels.</Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => navigation.navigate('Services')}>
            Voir les services
          </Button>
        </Card.Actions>
      </Card>

      <Button
        mode="outlined"
        style={styles.logoutButton}
        onPress={logout}
      >
        Déconnexion
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
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
    marginBottom: 16,
  },
  logoutButton: {
    marginTop: 20,
    borderColor: '#d32f2f',
    borderWidth: 1,
  },
});

export default HomeScreen;