// theme/colors.js - Thème avec support mode sombre

// Thème clair
export const lightTheme = {
  // Couleurs de base
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceLight: '#F5F5F5',
  surfaceDark: '#191919',
  
  // Couleurs de texte
  text: '#1B1B1B',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  
  // Couleurs d'accentuation
  primary: '#191919',
  primaryLight: '#484d4aff',
  primaryDark: '#152A1E',
  
  secondary: '#B7B3C8',
  secondaryLight: '#D4D1E0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Couleurs spécifiques
  accent: '#E5E7EB',
  highlight: '#D1FAE5',
  selection: '#E0E7FF',
  mint: '#6EE7B7',
  
  // Bordures et séparateurs
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
  
  // États
  hover: '#F9FAFB',
  active: '#F3F4F6',
  disabled: '#D1D5DB',
  
  // Catégories
  category1: '#3B82F6',
  category2: '#10B981',
  category3: '#8B5CF6',
  category4: '#F59E0B',
  category5: '#EC4899',
  category6: '#06B6D4',
  
  // Statuts
  statusBar: '#1F3D2B',
  activityBar: '#FFFFFF',
  sideBar: '#FFFFFF',
  
  // Ombres
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowLight: 'rgba(0, 0, 0, 0.04)',
  shadowMedium: 'rgba(0, 0, 0, 0.12)',
  
  // Transparences
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Couleurs spéciales
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  errorLight: '#FEE2E2',
};

// Thème sombre
export const darkTheme = {
  // Couleurs de base
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceLight: '#252525',
  surfaceDark: '#000000',
  
  // Couleurs de texte
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#6B6B6B',
  textInverse: '#1B1B1B',
  
  // Couleurs d'accentuation
  primary: '#FF6B9D',
  primaryLight: '#FF8FB3',
  primaryDark: '#E5527F',
  
  secondary: '#9D8FCC',
  secondaryLight: '#B5A9D9',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',
  
  // Couleurs spécifiques
  accent: '#3D3D3D',
  highlight: '#1A3D2E',
  selection: '#2D2A4A',
  mint: '#6EE7B7',
  
  // Bordures et séparateurs
  border: '#3D3D3D',
  borderLight: '#2D2D2D',
  divider: '#3D3D3D',
  
  // États
  hover: '#2D2D2D',
  active: '#3D3D3D',
  disabled: '#4D4D4D',
  
  // Catégories
  category1: '#60A5FA',
  category2: '#34D399',
  category3: '#A78BFA',
  category4: '#FBBF24',
  category5: '#F472B6',
  category6: '#22D3EE',
  
  // Statuts
  statusBar: '#0A0A0A',
  activityBar: '#1E1E1E',
  sideBar: '#1E1E1E',
  
  // Ombres
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.2)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
  
  // Transparences
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  
  // Couleurs spéciales
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  errorLight: '#3D1F1F',
};

// Export par défaut (thème clair pour compatibilité)
export const colors = lightTheme;

// Thème pour les onglets
export const tabTheme = {
  active: colors.primary,
  inactive: colors.textSecondary,
  background: colors.surface,
  border: colors.border,
};

// Thème pour les boutons
export const buttonTheme = {
  primary: {
    background: colors.primary,
    text: colors.white,
    hover: colors.primaryLight,
  },
  secondary: {
    background: colors.secondary,
    text: colors.text,
    hover: colors.secondaryLight,
  },
  success: {
    background: colors.success,
    text: colors.white,
    hover: '#34D399',
  },
  danger: {
    background: colors.error,
    text: colors.white,
    hover: '#F87171',
  },
  ghost: {
    background: colors.transparent,
    text: colors.text,
    border: colors.border,
    hover: colors.hover,
  },
};

// Thème pour les inputs
export const inputTheme = {
  background: colors.surface,
  border: colors.border,
  borderFocus: colors.primary,
  text: colors.text,
  placeholder: colors.textMuted,
};

// Thème pour les cartes
export const cardTheme = {
  background: colors.surface,
  border: colors.border,
  shadow: colors.shadow,
  hover: colors.hover,
  borderRadius: 16,
};

export default colors;
