import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

interface SvgAvatarProps {
  uri?: string | null;
  size?: number;
  style?: ViewStyle;
  isDarkMode?: boolean;
  onLoadStart?: () => void;
  onLoad?: () => void;
  onError?: (error: any) => void;
}

const SvgAvatar: React.FC<SvgAvatarProps> = ({
  uri,
  size = 80,
  style,
  isDarkMode = false,
  onLoadStart,
  onLoad,
  onError,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!uri);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
    onLoadStart?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = (error: any) => {
    console.log('❌ SvgAvatar error:', error);
    setIsLoading(false);
    setHasError(true);
    onError?.(error);
  };

  const containerStyle = [
    styles.container,
    { 
      width: size, 
      height: size, 
      borderRadius: size / 2 
    },
    style,
  ];

  // Si pas d'URI ou erreur, afficher le placeholder
  if (!uri || hasError) {
    return (
      <View style={[
        containerStyle, 
        styles.placeholder,
        isDarkMode && styles.placeholderDark
      ]}>
        <Ionicons 
          name="person" 
          size={size * 0.5} 
          color={isDarkMode ? "#9CA3AF" : "#666"} 
        />
      </View>
    );
  }

  // Afficher le SVG
  return (
    <View style={containerStyle}>
      <SvgUri
        uri={uri}
        width={size}
        height={size}
        onLoad={handleLoad}
        onError={handleError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderDark: {
    backgroundColor: '#374151',
  },
});

export default SvgAvatar;
