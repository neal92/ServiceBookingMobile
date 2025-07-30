import { StyleSheet } from 'react-native';

export const darkTheme = {
  colors: {
    background: '#111827', // gray-900
    card: '#1F2937', // gray-800
    text: '#FFFFFF',
    textSecondary: '#9CA3AF', // gray-400
    border: '#374151', // gray-700
    button: '#374151', // gray-700
    buttonText: '#FFFFFF',
    input: '#374151', // gray-700
    placeholder: '#9CA3AF', // gray-400
  }
};

export const lightTheme = {
  colors: {
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#222222',
    textSecondary: '#666666',
    border: '#E0E0E0',
    button: '#4F8EF7',
    buttonText: '#FFFFFF',
    input: '#F7F9FC',
    placeholder: '#999999',
  }
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0.5,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
});

export const getDarkModeStyles = (isDarkMode: boolean) => ({
  container: {
    backgroundColor: isDarkMode ? darkTheme.colors.background : lightTheme.colors.background,
  },
  card: {
    backgroundColor: isDarkMode ? darkTheme.colors.card : lightTheme.colors.card,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  },
  text: {
    color: isDarkMode ? darkTheme.colors.text : lightTheme.colors.text,
  },
  textSecondary: {
    color: isDarkMode ? darkTheme.colors.textSecondary : lightTheme.colors.textSecondary,
  },
  button: {
    backgroundColor: isDarkMode ? darkTheme.colors.button : lightTheme.colors.button,
  },
  buttonText: {
    color: isDarkMode ? darkTheme.colors.buttonText : lightTheme.colors.buttonText,
  },
  input: {
    backgroundColor: isDarkMode ? darkTheme.colors.input : lightTheme.colors.input,
    color: isDarkMode ? darkTheme.colors.text : lightTheme.colors.text,
  },
  border: {
    borderColor: isDarkMode ? darkTheme.colors.border : lightTheme.colors.border,
  },
});
