// AdminDashboard.js - Tableau de bord administrateur
import colors from '../theme/colors';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { authAPI } from '../services/api';

const AdminDashboard = ({ onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    activeUsers: 0,
    pendingProducts: 0,
  });
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      // Charger les infos admin
      const response = await authAPI.getMe();
      if (response.success) {
        setAdminInfo(response.user);
      }

      // TODO: Charger les statistiques depuis l'API admin
      // const statsResponse = await adminAPI.getStats();
      // setStats(statsResponse.stats);

      // Données de démonstration
      setStats({
        totalUsers: 156,
        totalProducts: 342,
        activeUsers: 89,
        pendingProducts: 12,
      });
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      Alert.alert('Erreur', 'Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion Admin',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await authAPI.logout();
              if (onLogout) {
                onLogout();
              }
            } catch (error) {
              console.error('Erreur déconnexion:', error);
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      id: '1',
      title: 'Gestion Utilisateurs',
      icon: 'users',
      color: colors.primary,
      route: 'UserManagement',
      badge: stats.totalUsers,
    },
    {
      id: '2',
      title: 'Gestion Produits',
      icon: 'cube',
      color: '#34C759',
      route: 'ProductManagement',
      badge: stats.totalProducts,
    },
    {
      id: '3',
      title: 'Produits en attente',
      icon: 'clock-o',
      color: colors.warning,
      route: 'PendingProducts',
      badge: stats.pendingProducts,
    },
    {
      id: '4',
      title: 'Statistiques',
      icon: 'bar-chart',
      color: '#5856D6',
      route: 'Statistics',
    },
    {
      id: '5',
      title: 'Rapports',
      icon: 'flag',
      color: colors.error,
      route: 'Reports',
    },
    {
      id: '6',
      title: 'Paramètres',
      icon: 'cog',
      color: '#8E8E93',
      route: 'AdminSettings',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.error} />
        <Text style={styles.loadingText}>Chargement du panneau admin...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* En-tête Admin */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.adminIconContainer}>
            <FontAwesome name="shield" size={30} color={colors.error} />
          </View>
          <View style={styles.adminInfo}>
            <Text style={styles.welcomeText}>Panneau Administrateur</Text>
            <Text style={styles.adminName}>{adminInfo?.name || 'Admin'}</Text>
            <View style={styles.adminBadge}>
              <FontAwesome name="star" size={12} color="#FFD700" />
              <Text style={styles.adminBadgeText}>Super Admin</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Statistiques rapides */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <FontAwesome name="users" size={30} color={colors.primary} />
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Utilisateurs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <FontAwesome name="cube" size={30} color="#34C759" />
            <Text style={styles.statNumber}>{stats.totalProducts}</Text>
            <Text style={styles.statLabel}>Produits</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <FontAwesome name="check-circle" size={30} color={colors.warning} />
            <Text style={styles.statNumber}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Actifs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
            <FontAwesome name="clock-o" size={30} color={colors.error} />
            <Text style={styles.statNumber}>{stats.pendingProducts}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
        </View>
      </View>

      {/* Menu de gestion */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Gestion</Text>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => Alert.alert('Navigation', `Vers ${item.title}`)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <FontAwesome name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <View style={styles.menuItemRight}>
              {item.badge !== undefined && (
                <View style={[styles.badge, { backgroundColor: item.color }]}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <FontAwesome name="chevron-right" size={16} color="#C7C7CC" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Actions rapides */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Action', 'Ajouter un utilisateur')}
          >
            <FontAwesome name="user-plus" size={24} color={colors.primary} />
            <Text style={styles.quickActionText}>Nouvel utilisateur</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Action', 'Valider les produits')}
          >
            <FontAwesome name="check" size={24} color="#34C759" />
            <Text style={styles.quickActionText}>Valider produits</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Action', 'Voir les rapports')}
          >
            <FontAwesome name="file-text" size={24} color={colors.warning} />
            <Text style={styles.quickActionText}>Rapports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => Alert.alert('Action', 'Exporter données')}
          >
            <FontAwesome name="download" size={24} color="#5856D6" />
            <Text style={styles.quickActionText}>Exporter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 LocProd Admin Panel</Text>
        <Text style={styles.footerSubtext}>Version 2.0.0 - Tous droits réservés</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adminIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  adminInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  adminName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    fontSize: 12,
    color: '#8B6914',
    fontWeight: '600',
    marginLeft: 5,
  },
  logoutButton: {
    padding: 10,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  menuContainer: {
    padding: 20,
    paddingTop: 0,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  quickActionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
});

export default AdminDashboard;
