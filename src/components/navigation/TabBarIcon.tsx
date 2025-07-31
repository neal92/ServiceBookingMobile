import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TabBarIconProps {
  iconName: string;
  focused: boolean;
  color: string;
  label: string;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ iconName, focused, color, label }) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const opacityAnimation = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (focused) {
      // Animation quand l'onglet devient actif
      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Animation quand l'onglet devient inactif
      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
        Animated.timing(opacityAnimation, {
          toValue: 0.6,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [focused]);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.iconContainer,
        {
          transform: [{ scale: scaleAnimation }],
          opacity: opacityAnimation,
        }
      ]}>
        <Ionicons name={iconName as any} size={24} color={color} /> {/* Taille normale */}
      </Animated.View>
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
      {focused && (
        <Animated.View 
          style={[
            styles.indicator, 
            { 
              backgroundColor: color,
              opacity: opacityAnimation,
            }
          ]} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70, // Plus large pour plus d'espace
    height: 60, // Plus haut pour plus d'espace vertical
    marginTop: 0, // Pas de décalage vertical
  },
  iconContainer: {
    padding: 8, // Padding normal
    borderRadius: 12,
    marginBottom: 2, // Espace entre l'icône et le texte
    minWidth: 32, // Largeur minimale pour les icônes
    minHeight: 32, // Hauteur minimale pour les icônes
    alignItems: 'center',
    justifyContent: 'center',
    // Pas d'arrière-plan par défaut pour éviter de cacher l'icône
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
