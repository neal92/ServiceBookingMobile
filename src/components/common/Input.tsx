import React, { useState } from 'react';
import { TextInput, StyleSheet, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  style, 
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(props.value || '');

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[styles.label, isFocused || value ? styles.labelFocused : null]}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style
        ]}
        placeholderTextColor="#aaa"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChangeText={text => {
          setValue(text);
          props.onChangeText && props.onChangeText(text);
        }}
        value={value}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const ACCENT_COLOR = '#4F8EF7';

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    marginBottom: 4,
    fontSize: 15,
    fontWeight: '500',
    color: '#888',
  },
  labelFocused: {
    color: ACCENT_COLOR,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    padding: 14,
    fontSize: 17,
    color: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  inputFocused: {
    borderColor: ACCENT_COLOR,
    shadowOpacity: 0.15,
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 13,
    marginTop: 6,
  },
});
