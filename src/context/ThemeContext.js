// context/ThemeContext.js - Contexte pour le mode sombre
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../theme/colors';

const ThemeContext = createContext();

const THEME_KEY = '@locprod_theme';

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colors, setColors] = useState(lightTheme);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_KEY);
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        setColors(darkTheme);
      }
    } catch (error) {
      console.error('Erreur chargement thème:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      setColors(newMode ? darkTheme : lightTheme);
      await AsyncStorage.setItem(THEME_KEY, newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Erreur sauvegarde thème:', error);
    }
  };

  const setTheme = async (mode) => {
    try {
      const isDark = mode === 'dark';
      setIsDarkMode(isDark);
      setColors(isDark ? darkTheme : lightTheme);
      await AsyncStorage.setItem(THEME_KEY, mode);
    } catch (error) {
      console.error('Erreur sauvegarde thème:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
