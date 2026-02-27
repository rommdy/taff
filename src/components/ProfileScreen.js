// ProfileScreen.js - Connecté à l'API avec gestion mode invité
import { lightTheme as staticColors } from '../theme/colors';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usersAPI, authAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen = ({ onLogout }) => {
  const navigation = useNavigation();
  const { colors: themeColors } = useTheme();
  const colors = themeColors || staticColors;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productsCount, setProductsCount] = useState(0);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkGuestMode();
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const adminFlag = await AsyncStorage.getItem('isAdmin');
      setIsAdmin(adminFlag === 'true');
    } catch (error) {
      console.error('Erreur vérification admin:', error);
    }
  };

  const checkGuestMode = async () => {
    try {
      const guestMode = await AsyncStorage.getItem('guestMode');
      if (guestMode === 'true') {
        setIsGuestMode(true);
        setLoading(false);
      } else {
        loadUserProfile();
      }
    } catch (error) {
      console.error('Erreur vérification mode invité:', error);
      loadUserProfile();
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getProfile();
      if (response.success) {
        setUser(response.user);
        setProductsCount(response.user.products?.length || 0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      Alert.alert('Erreur', 'Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: '1', name: 'Mes Produits', icon: 'list', route: 'MesProduits', badge: productsCount },
    { id: '2', name: 'Ajouter un Produit', icon: 'plus-circle', route: 'AjouterProduitScreen' },
    { id: '3', name: 'Modifier mon profil', icon: 'edit', route: 'EditProfile' },
    { id: '4', name: 'Paramètres', icon: 'cog', route: 'Parametres' },
    ...(isAdmin ? [{ id: '5', name: 'Signalements', icon: 'flag', route: 'AdminReports', adminOnly: true }] : []),
  ];

  const handleLogout = async () => {
    const message = isGuestMode 
      ? 'Voulez-vous quitter le mode invité ?'
      : 'Êtes-vous sûr de vouloir vous déconnecter ?';
    
    const buttonText = isGuestMode ? 'Quitter' : 'Déconnexion';

    Alert.alert(
      isGuestMode ? 'Mode Invité' : 'Déconnexion',
      message,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: buttonText,
          style: 'destructive',
          onPress: async () => {
            try {
              if (!isGuestMode) {
                await authAPI.logout();
              }
              // Supprimer le flag invité
              await AsyncStorage.removeItem('guestMode');
              if (onLogout) {
                onLogout();
              }
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
            }
          }
        }
      ]
    );
  };

  const handleCreateAccount = () => {
    Alert.alert(
      'Créer un compte',
      'Vous allez être redirigé vers la page d\'inscription.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('guestMode');
              if (onLogout) {
                onLogout();
              }
            } catch (error) {
              console.error('Erreur:', error);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: staticColors.background }]}>
        <ActivityIndicator size="large" color={staticColors.primary} />
        <Text style={[styles.loadingText, { color: staticColors.textSecondary }]}>Chargement...</Text>
      </View>
    );
  }

  // Mode Invité
  if (isGuestMode) {
    return (
      <View style={[styles.container, { backgroundColor: staticColors.background }]}>
        {/* En-tête Mode Invité */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <FontAwesome name="user-secret" size={40} color={staticColors.surface} />
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Mode Invité</Text>
              <Text style={styles.userEmail}>Accès limité</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <FontAwesome name="sign-out" size={22} color={staticColors.error} />
          </TouchableOpacity>
        </View>

        {/* Message Mode Invité */}
        <View style={styles.guestMessageContainer}>
          <FontAwesome name="info-circle" size={50} color={staticColors.primary} />
          <Text style={styles.guestMessageTitle}>Vous êtes en mode invité</Text>
          <Text style={styles.guestMessageText}>
            Vous pouvez consulter les produits disponibles,{"\n"}
            mais vous devez créer un compte pour :
          </Text>
          <View style={styles.guestFeaturesList}>
            <View style={styles.guestFeatureItem}>
              <FontAwesome name="plus-circle" size={16} color={staticColors.textSecondary} />
              <Text style={styles.guestFeatureText}>Ajouter des produits</Text>
            </View>
            <View style={styles.guestFeatureItem}>
              <FontAwesome name="edit" size={16} color={staticColors.textSecondary} />
              <Text style={styles.guestFeatureText}>Modifier votre profil</Text>
            </View>
            <View style={styles.guestFeatureItem}>
              <FontAwesome name="heart" size={16} color={staticColors.textSecondary} />
              <Text style={styles.guestFeatureText}>Sauvegarder des favoris</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.createAccountButton} onPress={handleCreateAccount}>
            <FontAwesome name="user-plus" size={20} color={staticColors.surface} />
            <Text style={styles.createAccountButtonText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 LocProd</Text>
          <Text style={styles.footerSubtext}>Version 2.0.0</Text>
        </View>
      </View>
    );
  }

  // Mode Connecté
  return (
    <ScrollView style={[styles.container, { backgroundColor: staticColors.background }]} contentContainerStyle={styles.scrollContent}>
      {/* En-tête avec profil */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome name="user" size={40} color={staticColors.surface} />
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Utilisateur'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.role === 'admin' && (
              <View style={styles.adminBadge}>
                <FontAwesome name="star" size={12} color={staticColors.warning} />
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={22} color={staticColors.error} />
        </TouchableOpacity>
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <FontAwesome name="cube" size={24} color={staticColors.primary} />
          <Text style={styles.statNumber}>{productsCount}</Text>
          <Text style={styles.statLabel}>Produits</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <FontAwesome name="calendar" size={24} color={staticColors.success} />
          <Text style={styles.statNumber}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }) : '-'}
          </Text>
          <Text style={styles.statLabel}>Membre depuis</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={styles.menuIconContainer}>
              <FontAwesome name={item.icon} size={22} color={item.adminOnly ? staticColors.warning : staticColors.primary} />
            </View>
            <Text style={styles.menuText}>{item.name}</Text>
            {item.badge > 0 && (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>{item.badge}</Text>
              </View>
            )}
            <FontAwesome name="chevron-right" size={16} color={staticColors.textMuted} style={styles.menuChevron} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Copyright */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 LocProd</Text>
        <Text style={styles.footerSubtext}>Version 2.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: staticColors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: staticColors.textSecondary,
  },
  header: {
    backgroundColor: staticColors.primary,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: staticColors.textInverse,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  adminText: {
    fontSize: 12,
    color: staticColors.warning,
    fontWeight: '600',
    marginLeft: 4,
  },
  logoutButton: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  statsContainer: {
    backgroundColor: staticColors.surface,
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: staticColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: staticColors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: staticColors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: staticColors.border,
  },
  menuContainer: {
    backgroundColor: staticColors.surface,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: staticColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.accent,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: staticColors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: staticColors.text,
    fontWeight: '500',
  },
  menuBadge: {
    backgroundColor: staticColors.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  menuBadgeText: {
    color: staticColors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuChevron: {
    marginLeft: 'auto',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    color: staticColors.textSecondary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: staticColors.textMuted,
  },
  guestMessageContainer: {
    backgroundColor: staticColors.surface,
    margin: 20,
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: staticColors.border,
    shadowColor: staticColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  guestMessageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: staticColors.text,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  guestMessageText: {
    fontSize: 15,
    color: staticColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  guestFeaturesList: {
    width: '100%',
    marginBottom: 25,
  },
  guestFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: staticColors.surfaceLight,
    borderRadius: 10,
    marginBottom: 10,
  },
  guestFeatureText: {
    fontSize: 15,
    color: staticColors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: staticColors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '100%',
    shadowColor: staticColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createAccountButtonText: {
    color: staticColors.surface,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ProfileScreen;
