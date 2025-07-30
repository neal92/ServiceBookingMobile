import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TabBarIconProps {
  iconName: string;
  focused: boolean;
  color: string;
  label: string;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ iconName, focused, color, label }) => {
  return (
    <View style={styles.container}>
      <View style={[
        styles.iconContainer,
        focused ? { backgroundColor: `${color}15` } : {} // Léger fond plus visible (15% d'opacité)
      ]}>
        <Ionicons name={iconName as any} size={24} color={color} /> {/* Icône légèrement plus grande */}
      </View>
      <Text 
        numberOfLines={1} // Assure que le texte reste sur une seule ligne
        style={[
          styles.label, 
          { color: focused ? color : '#555' }, // Gris plus foncé pour meilleure lisibilité
          focused && styles.labelFocused
        ]}
      >
        {label}
      </Text>
      {focused && <View style={[styles.indicator, { backgroundColor: color }]} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70, // Plus large pour plus d'espace
    height: 50, // Plus haut pour plus d'espace vertical
    marginTop: -2, // Remonte légèrement tous les éléments
  },
  iconContainer: {
    padding: 5,
    borderRadius: 12,
    marginBottom: 1, // Réduit l'espace entre l'icône et le texte
  },
  label: {
    fontSize: 12, // Taille de police augmentée pour meilleure lisibilité
    marginTop: 2, // Ajuste l'espace entre l'icône et le texte
    fontWeight: '600', // Plus épais pour meilleure lisibilité
    textAlign: 'center', 
    letterSpacing: 0.2, // Légèrement plus d'espace entre les lettres
  },
  labelFocused: {
    fontWeight: '700',
    fontSize: 12.5, // Plus grand quand actif
  },
  indicator: {
    position: 'absolute',
    bottom: -6, // Remonté davantage pour être plus près du texte
    height: 3,
    width: 28, // Un peu plus large
    borderRadius: 1.5,
  },
});

export default TabBarIcon;
