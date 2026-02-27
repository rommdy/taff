// Configuration i18n pour le support multi-langues
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importer les traductions
import fr from './locales/fr.json';
import en from './locales/en.json';
import es from './locales/es.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import ar from './locales/ar.json';
import zh from './locales/zh.json';

// Liste des langues disponibles
export const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

// Ressources de traduction
const resources = {
  fr: { translation: fr },
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  pt: { translation: pt },
  ar: { translation: ar },
  zh: { translation: zh },
};

// Clé de stockage pour la langue
const LANGUAGE_KEY = 'app_language';

// Obtenir la langue du système sans expo-localization
const getDeviceLanguage = () => {
  try {
    let deviceLanguage = 'fr';
    if (Platform.OS === 'ios') {
      deviceLanguage = NativeModules.SettingsManager?.settings?.AppleLocale ||
                       NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
                       'fr';
    } else if (Platform.OS === 'android') {
      deviceLanguage = NativeModules.I18nManager?.localeIdentifier || 'fr';
    }
    // Extraire le code de langue (ex: "fr_FR" -> "fr")
    return deviceLanguage.split(/[-_]/)[0];
  } catch (error) {
    return 'fr';
  }
};

// Obtenir la langue sauvegardée ou la langue du système
export const getStoredLanguage = async () => {
  try {
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (storedLanguage && LANGUAGES.find(l => l.code === storedLanguage)) {
      return storedLanguage;
    }
    // Utiliser la langue du système si disponible
    const deviceLanguage = getDeviceLanguage();
    // Vérifier si la langue du système est supportée
    if (LANGUAGES.find(l => l.code === deviceLanguage)) {
      return deviceLanguage;
    }
    return 'fr'; // Langue par défaut
  } catch (error) {
    console.error('Erreur lors de la récupération de la langue:', error);
    return 'fr';
  }
};

// Sauvegarder la langue choisie
export const setStoredLanguage = async (languageCode) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
    await i18n.changeLanguage(languageCode);
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la langue:', error);
    return false;
  }
};

// Vérifier si c'est la première ouverture de l'app
export const isFirstLaunch = async () => {
  try {
    const hasLaunched = await AsyncStorage.getItem('hasLaunched');
    if (hasLaunched === null) {
      await AsyncStorage.setItem('hasLaunched', 'true');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// Initialiser i18n
const initI18n = async () => {
  const language = await getStoredLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: 'fr',
      compatibilityJSON: 'v3',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  
  return language;
};

// Initialiser au chargement
initI18n();

export default i18n;
