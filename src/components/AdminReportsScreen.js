// AdminReportsScreen.js - Écran admin pour gérer les signalements
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect } from '@react-navigation/native';
import colors from '../theme/colors';
import { reportsAPI, productsAPI } from '../services/api';

const REASON_LABELS = {
  inappropriate: 'Contenu inapproprié',
  spam: 'Spam ou publicité',
  fake: 'Fausse information',
  duplicate: 'Produit en double',
  expired: 'Produit expiré',
  wrong_location: 'Mauvaise localisation',
  other: 'Autre raison',
};

const STATUS_LABELS = {
  pending: 'En attente',
  reviewed: 'Examiné',
  resolved: 'Résolu',
  dismissed: 'Rejeté',
};

const STATUS_COLORS = {
  pending: colors.warning,
  reviewed: colors.info || colors.primary,
  resolved: colors.success,
  dismissed: colors.textMuted,
};

const AdminReportsScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('pending');

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [selectedFilter])
  );

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getAll(selectedFilter);
      if (response.success) {
        setReports(response.reports);
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
      Alert.alert('Erreur', 'Impossible de charger les signalements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleUpdateStatus = (report, newStatus) => {
    Alert.alert(
      'Mettre à jour le statut',
      `Changer le statut en "${STATUS_LABELS[newStatus]}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await reportsAPI.updateStatus(report._id, newStatus);
              loadReports();
              Alert.alert('Succès', 'Statut mis à jour');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
            }
          },
        },
      ]
    );
  };

  const handleDeleteProduct = (report) => {
    if (!report.product) return;
    
    Alert.alert(
      'Supprimer le produit',
      `Voulez-vous supprimer le produit "${report.product.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await productsAPI.adminDelete(report.product._id);
              await reportsAPI.updateStatus(report._id, 'resolved');
              loadReports();
              Alert.alert('Succès', 'Produit supprimé et signalement résolu');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le produit');
            }
          },
        },
      ]
    );
  };

  const handleDismissReport = (report) => {
    Alert.alert(
      'Rejeter le signalement',
      'Ce signalement sera marqué comme non justifié.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          onPress: async () => {
            try {
              await reportsAPI.updateStatus(report._id, 'dismissed');
              loadReports();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de rejeter le signalement');
            }
          },
        },
      ]
    );
  };

  const renderFilterButton = (filter, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
      {stats && stats[filter] > 0 && (
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[filter] }]}>
          <Text style={styles.badgeText}>{stats[filter]}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderReport = ({ item }) => (
    <View style={styles.reportCard}>
      {/* En-tête */}
      <View style={styles.reportHeader}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
        </View>
        <Text style={styles.reportDate}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR')}
        </Text>
      </View>

      {/* Produit signalé */}
      {item.product ? (
        <TouchableOpacity 
          style={styles.productInfo}
          onPress={() => navigation.navigate('ProductDetail', { product: item.product })}
        >
          {item.product.images?.[0] && (
            <Image
              source={{ uri: item.product.images[0] }}
              style={styles.productImage}
            />
          )}
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{item.product.name}</Text>
            <Text style={styles.productCategory}>
              {item.product.category?.name || 'Sans catégorie'}
            </Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ) : (
        <View style={styles.productInfo}>
          <Text style={styles.productDeleted}>Produit supprimé</Text>
        </View>
      )}

      {/* Raison du signalement */}
      <View style={styles.reasonContainer}>
        <FontAwesome name="flag" size={14} color={colors.warning} />
        <Text style={styles.reasonText}>{REASON_LABELS[item.reason]}</Text>
      </View>

      {/* Description si présente */}
      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}

      {/* Signalé par */}
      {item.reporter && (
        <Text style={styles.reporterText}>
          Signalé par: {item.reporter.email || 'Anonyme'}
        </Text>
      )}

      {/* Actions */}
      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.reviewButton]}
            onPress={() => handleUpdateStatus(item, 'reviewed')}
          >
            <FontAwesome name="eye" size={14} color={colors.white} />
            <Text style={styles.actionButtonText}>Examiner</Text>
          </TouchableOpacity>
          
          {item.product && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteProductButton]}
              onPress={() => handleDeleteProduct(item)}
            >
              <FontAwesome name="trash" size={14} color={colors.white} />
              <Text style={styles.actionButtonText}>Supprimer</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dismissButton]}
            onPress={() => handleDismissReport(item)}
          >
            <FontAwesome name="times" size={14} color={colors.white} />
            <Text style={styles.actionButtonText}>Rejeter</Text>
          </TouchableOpacity>
        </View>
      )}

      {item.status === 'reviewed' && item.product && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteProductButton]}
            onPress={() => handleDeleteProduct(item)}
          >
            <FontAwesome name="trash" size={14} color={colors.white} />
            <Text style={styles.actionButtonText}>Supprimer le produit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dismissButton]}
            onPress={() => handleDismissReport(item)}
          >
            <FontAwesome name="times" size={14} color={colors.white} />
            <Text style={styles.actionButtonText}>Rejeter</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des signalements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Titre */}
      <View style={styles.header}>
        <Text style={styles.title}>Signalements</Text>
        {stats && (
          <Text style={styles.subtitle}>
            {stats.pending} en attente sur {stats.pending + stats.reviewed + stats.resolved + stats.dismissed} total
          </Text>
        )}
      </View>

      {/* Filtres */}
      <View style={styles.filters}>
        {renderFilterButton('pending', 'En attente')}
        {renderFilterButton('reviewed', 'Examinés')}
        {renderFilterButton('resolved', 'Résolus')}
        {renderFilterButton('dismissed', 'Rejetés')}
      </View>

      {/* Liste des signalements */}
      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="check-circle" size={50} color={colors.success} />
            <Text style={styles.emptyText}>Aucun signalement</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 5,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
    paddingTop: 0,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  reportDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  productCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  productDeleted: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  reasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  reporterText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '500',
  },
  reviewButton: {
    backgroundColor: colors.info || colors.primary,
  },
  deleteProductButton: {
    backgroundColor: colors.error,
  },
  dismissButton: {
    backgroundColor: colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 15,
  },
});

export default AdminReportsScreen;
