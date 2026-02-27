// App.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Navigation from './src/components/Navigation.js';
import LanguageSelectScreen from './src/components/LanguageSelectScreen.js';
import { isFirstLaunch } from './src/i18n';
import './src/i18n'; // Initialiser i18n
import { lightTheme } from './src/theme/colors';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const AppContent = () => {
  const { colors } = useTheme();
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const firstLaunch = await isFirstLaunch();
      setShowLanguageSelect(firstLaunch);
    } catch (error) {
      console.error('Erreur vérification premier lancement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (showLanguageSelect) {
    return (
      <LanguageSelectScreen
        isOnboarding={true}
        onLanguageSelected={() => setShowLanguageSelect(false)}
      />
    );
  }

  return <Navigation />;
};

const App = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: lightTheme.background,
  },
});

export default App;


/*import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import MapComponent from './src/components/Carte.js'

export default function App() {
  return (
    <View style={{flex: 1}}>
      <MapComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
*/