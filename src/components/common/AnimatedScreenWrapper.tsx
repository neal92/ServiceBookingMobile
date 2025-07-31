import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

interface AnimatedScreenWrapperProps {
  children: React.ReactNode;
  isActive: boolean;
}

const { width } = Dimensions.get('window');

const AnimatedScreenWrapper: React.FC<AnimatedScreenWrapperProps> = ({ children, isActive }) => {
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (isActive) {
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: -width * 0.1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isActive]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnimation,
        transform: [{ translateX: slideAnimation }],
      }}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedScreenWrapper;
