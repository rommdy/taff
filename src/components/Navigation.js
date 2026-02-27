// Navigation.js
import { lightTheme as staticColors } from '../theme/colors';
import React, { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import CatalogueScreen from './CatalogueScreen';
import MapScreen from './MapScreen.js';
import ProfileScreen from './ProfileScreen';
import AjouterProduitScreen from './AjouterProduitScreen';
import EditProfileScreen from './EditProfileScreen';
import SettingsScreen from './SettingsScreen';
import MesProduitsScreen from './MesProduitsScreen';
import ProductDetailScreen from './ProductDetailScreen';
import LoginScreen from '../../LoginScreen';
import SignUpScreen from '../../SignUpScreen';
import AdminLoginScreen from './AdminLoginScreen';
import AdminReportsScreen from './AdminReportsScreen';
import { getToken, authAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import 'react-native-gesture-handler';

// Configuration du deep linking
const linking = {
  prefixes: ['locprod://', 'https://locprod.app'],
  config: {
    screens: {
      Catalogue: {
        screens: {
          ProductDetail: 'product/:productId',
        },
      },
    },
  },
};

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator pour l'authentification
const AuthStack = ({ onLogin }) => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="SignUp">
        {(props) => <SignUpScreen {...props} onSignUp={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="AdminLogin">
        {(props) => <AdminLoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const Navigation = () => {
  const { isDarkMode, colors: themeColors } = useTheme();
  const colors = themeColors || staticColors;
  
  // Thèmes personnalisés pour React Navigation
  const CustomLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };
  
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au démarrage
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await getToken();
      if (token) {
        // Vérifier si le token est valide
        const response = await authAPI.getMe();
        if (response.success) {
          setUserLoggedIn(true);
        }
      }
    } catch (error) {
      console.log('Utilisateur non connecté');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setUserLoggedIn(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (isLoading) {
    // Vous pouvez afficher un splash screen ici
    return null;
  }

  // Stack Navigator pour le profil avec les écrans imbriqués
  const ProfileStack = () => {
    const defaultHeaderStyle = {
      headerStyle: {
        backgroundColor: colors.primary,
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: colors.textInverse,
      headerTitleStyle: {
        fontWeight: 'bold',
        color: colors.textInverse,
      },
    };

    return (
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        <Stack.Screen 
          name="ProfileMain" 
          options={{ 
            headerShown: false,
            title: 'Profil'
          }}
        >
          {() => <ProfileScreen onLogout={handleLogout} />}
        </Stack.Screen>
        <Stack.Screen 
          name="AjouterProduitScreen" 
          component={AjouterProduitScreen}
          options={{
            title: 'Ajouter un Produit',
            ...defaultHeaderStyle,
          }}
        />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen}
          options={{
            title: 'Modifier mon profil',
            ...defaultHeaderStyle,
          }}
        />
        <Stack.Screen 
          name="MesProduits" 
          component={MesProduitsScreen}
          options={{
            title: 'Mes Produits',
            ...defaultHeaderStyle,
          }}
        />
        <Stack.Screen 
          name="Parametres"
          options={{
            title: 'Paramètres',
            ...defaultHeaderStyle,
          }}
        >
          {() => <SettingsScreen onLogout={handleLogout} />}
        </Stack.Screen>
        <Stack.Screen 
          name="AdminReports" 
          component={AdminReportsScreen}
          options={{
            title: 'Signalements',
            ...defaultHeaderStyle,
          }}
        />
      </Stack.Navigator>
    );
  };

  // Stack Navigator pour le catalogue avec détail produit
  const CatalogueStack = () => {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="CatalogueMain" component={CatalogueScreen} />
        <Stack.Screen 
          name="ProductDetail" 
          component={ProductDetailScreen}
          options={{
            headerShown: true,
            title: 'Détail du produit',
            headerStyle: {
              backgroundColor: colors.primary,
              borderBottomWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: colors.textInverse,
            headerTitleStyle: {
              fontWeight: 'bold',
              color: colors.textInverse,
            },
          }}
        />
      </Stack.Navigator>
    );
  };

  if (!userLoggedIn) {
    return (
      <NavigationContainer theme={isDarkMode ? CustomDarkTheme : CustomLightTheme}>
        <AuthStack onLogin={() => setUserLoggedIn(true)} />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer theme={isDarkMode ? CustomDarkTheme : CustomLightTheme} linking={linking}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 0,
            height: 65,
            paddingBottom: 10,
            paddingTop: 10,
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: colors.primary,
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: colors.textInverse,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Tab.Screen
          name="Catalogue"
          component={CatalogueStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="th-large" color={color} size={size} />
            ),
            tabBarLabel: 'Catalogue',
          }}
        />
        <Tab.Screen
          name="Carte"
          component={MapScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="map-marker" color={color} size={size} />
            ),
            tabBarLabel: 'Carte',
          }}
        />
       <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" color={color} size={size} />
          ),
          tabBarLabel: 'Profil',
          headerShown: false,
        }}
      />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
