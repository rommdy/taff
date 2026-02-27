// LanguageSelectScreen.js - Écran de sélection de langue (onboarding et paramètres)
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import colors from '../theme/colors';
import { LANGUAGES, setStoredLanguage } from '../i18n';

const LanguageSelectScreen = ({ onLanguageSelected, isOnboarding = false }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [loading, setLoading] = useState(false);

  const handleSelectLanguage = async (languageCode) => {
    setSelectedLanguage(languageCode);
    setLoading(true);
    
    try {
      await setStoredLanguage(languageCode);
      
      if (onLanguageSelected) {
        onLanguageSelected(languageCode);
      }
    } catch (error) {
      console.error('Erreur changement de langue:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isOnboarding ? '🌍 ' : ''}{t('onboarding.selectLanguage')}
        </Text>
        {isOnboarding && (
          <Text style={styles.subtitle}>{t('onboarding.welcome')}</Text>
        )}
      </View>

      <ScrollView 
        style={styles.languageList}
        contentContainerStyle={styles.languageListContent}
        showsVerticalScrollIndicator={false}
      >
        {LANGUAGES.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageItem,
              selectedLanguage === language.code && styles.languageItemSelected,
            ]}
            onPress={() => handleSelectLanguage(language.code)}
            disabled={loading}
          >
            <Text style={styles.languageFlag}>{language.flag}</Text>
            <Text
              style={[
                styles.languageName,
                selectedLanguage === language.code && styles.languageNameSelected,
              ]}
            >
              {language.name}
            </Text>
            {selectedLanguage === language.code && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isOnboarding && (
        <TouchableOpacity
          style={[styles.continueButton, loading && styles.buttonDisabled]}
          onPress={() => onLanguageSelected && onLanguageSelected(selectedLanguage)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.continueButtonText}>{t('onboarding.continue')}</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  languageList: {
    flex: 1,
  },
  languageListContent: {
    paddingBottom: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  languageItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  languageFlag: {
    fontSize: 32,
    marginRight: 15,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  languageNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LanguageSelectScreen;
