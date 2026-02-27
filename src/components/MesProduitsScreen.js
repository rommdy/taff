// MesProduitsScreen.js - Liste des produits de l'utilisateur
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../theme/colors';
import { productsAPI, usersAPI } from '../services/api';

const MesProduitsScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useFocusEffect(
    useCallback(() => {
      checkAdminAndLoadProducts();
    }, [])
  );

  const checkAdminAndLoadProducts = async () => {
    const adminFlag = await AsyncStorage.getItem('isAdmin');
    setIsAdmin(adminFlag === 'true');
    loadProducts(adminFlag === 'true');
  };

  const loadProducts = async (adminMode = false) => {
    try {
      setLoading(true);
      
      if (adminMode) {
        // Admin: charger TOUS les produits
        const response = await productsAPI.getAll();
        if (response.success) {
          setProducts(response.products || []);
        }
      } else {
        // Utilisateur normal: charger ses propres produits
        const response = await usersAPI.getProfile();
        if (response.success) {
          setProducts(response.user.products || []);
        }
      }
    } catch (error) {
      console.error('Erreur chargement produits:', error);
      Alert.alert('Erreur', 'Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts(isAdmin);
    setRefreshing(false);
  };

  const handleDeleteProduct = (product) => {
    Alert.alert(
      'Supprimer le produit',
      `Voulez-vous vraiment supprimer "${product.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Utiliser adminDelete si admin, sinon delete normal
              if (isAdmin) {
                await productsAPI.adminDelete(product._id);
              } else {
                await productsAPI.delete(product._id);
              }
              setProducts(products.filter(p => p._id !== product._id));
              Alert.alert('Succès', 'Produit supprimé');
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le produit');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category) => {
    if (!category) return { name: 'cube', family: 'FontAwesome' };
    return {
      name: category.icon || 'cube',
      family: category.iconFamily || 'FontAwesome',
    };
  };

  const renderProduct = ({ item }) => {
    const categoryIcon = getCategoryIcon(item.category);
    
    return (
      <View style={styles.productCard}>
        <View style={styles.productImageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImagePlaceholder, { backgroundColor: item.category?.color || colors.primary }]}>
              <FontAwesome name={categoryIcon.name} size={30} color={colors.surface} />
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productCategory} numberOfLines={1}>
            {item.category?.name || 'Sans catégorie'}
          </Text>
          {item.location?.address && (
            <View style={styles.locationRow}>
              <FontAwesome name="map-marker" size={12} color={colors.textSecondary} />
              <Text style={styles.productLocation} numberOfLines={1}>
                {item.location.address}
              </Text>
            </View>
          )}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
            </View>
            {item.quantity > 1 && (
              <Text style={styles.quantityText}>x{item.quantity}</Text>
            )}
          </View>
        </View>

        <View style={styles.productActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteProduct(item)}
          >
            <FontAwesome name="trash" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'disponible': return colors.success;
      case 'vendu': return colors.error;
      case 'reserve': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'disponible': return 'Disponible';
      case 'vendu': return 'Vendu';
      case 'reserve': return 'Réservé';
      default: return status;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="inbox" size={60} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Aucun produit</Text>
          <Text style={styles.emptyText}>
            Vous n'avez pas encore ajouté de produit.
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AjouterProduitScreen')}
          >
            <FontAwesome name="plus" size={18} color={colors.surface} />
            <Text style={styles.addButtonText}>Ajouter un produit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <FontAwesome name="shield" size={14} color={colors.error} />
                  <Text style={styles.adminBadgeText}>Mode Admin - Tous les produits</Text>
                </View>
              )}
              <Text style={styles.listHeaderText}>
                {products.length} produit{products.length > 1 ? 's' : ''}
              </Text>
            </View>
          }
        />
      )}
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
  listContent: {
    padding: 15,
  },
  listHeader: {
    marginBottom: 15,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.error,
  },
  adminBadgeText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  listHeaderText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  productImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  productLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    color: colors.surface,
    fontWeight: '600',
  },
  quantityText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
    fontWeight: '600',
  },
  productActions: {
    justifyContent: 'center',
    paddingLeft: 10,
  },
  actionButton: {
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 10,
  },
  addButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MesProduitsScreen;
