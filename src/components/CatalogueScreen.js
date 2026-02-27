import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { lightTheme as staticColors } from '../theme/colors';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import categories from '../../config/categories';
import { productsAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const logoImage = require('../../assets/logo2.png');
const nomImage = require('../../assets/nom.png');

const CataloguePage = () => {
  const navigation = useNavigation();
  const { colors: themeColors } = useTheme();
  const colors = themeColors || staticColors;
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('categories'); // 'categories' ou 'products'

  // Charger les produits au démarrage
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      if (response.success) {
        setProducts(response.products || []);
        setFilteredProducts(response.products || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
      setViewMode('categories');
      return;
    }

    try {
      setLoading(true);
      setViewMode('products');
      const response = await productsAPI.search(searchTerm);
      if (response.success) {
        setFilteredProducts(response.products || []);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = async (categoryId) => {
    try {
      setLoading(true);
      setViewMode('products');
      const response = await productsAPI.searchByCategory(categoryId);
      if (response.success) {
        setFilteredProducts(response.products || []);
      }
    } catch (error) {
      console.error('Erreur lors du filtrage:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAllCategories = () => {
    setViewMode('categories');
    setSearchTerm('');
    setFilteredProducts(products);
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: staticColors.background }]}>
        <ActivityIndicator size="large" color={staticColors.primary} />
        <Text style={[styles.loadingText, { color: staticColors.textSecondary }]}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: staticColors.background }]}>
      {/* Header avec logo et nom */}
      <View style={styles.headerBanner}>
        <Image source={logoImage} style={styles.headerLogo} resizeMode="contain" />
        <Image source={nomImage} style={styles.headerNom} resizeMode="contain" />
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={(text) => setSearchTerm(text)}
          placeholder="Rechercher des produits..."
          placeholderTextColor={staticColors.textMuted}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <FontAwesome name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bouton pour revenir aux catégories */}
      {viewMode === 'products' && (
        <TouchableOpacity style={styles.backButton} onPress={showAllCategories}>
          <FontAwesome name="th-large" size={16} color={staticColors.primary} />
          <Text style={styles.backButtonText}>Voir toutes les catégories</Text>
        </TouchableOpacity>
      )}

      {/* Affichage des catégories ou produits */}
      {viewMode === 'categories' ? (
        <FlatList
          key="categories-grid"
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const IconComponent = item.iconFamily === 'FontAwesome5' ? FontAwesome5 : FontAwesome;
            // Compter les produits de cette catégorie
            const count = products.filter(p => p.category?.id === item.id).length;
            return (
              <TouchableOpacity
                style={styles.productContainer}
                onPress={() => filterByCategory(item.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                  <IconComponent 
                    name={item.icon} 
                    size={50} 
                    color={item.color} 
                  />
                </View>
                <Text style={styles.productText}>{item.name}</Text>
                {count > 0 && (
                  <View style={[styles.badge, { backgroundColor: item.color }]}>
                    <Text style={styles.badgeText}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <FlatList
          key="products-list"
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="inbox" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Aucun produit trouvé</Text>
            </View>
          }
          renderItem={({ item }) => {
            const IconComponent = item.category?.iconFamily === 'FontAwesome5' ? FontAwesome5 : FontAwesome;
            return (
              <View style={styles.productCard}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
                >
                  <View style={styles.productCardHeader}>
                    <View style={[styles.smallIconContainer, { backgroundColor: item.category?.color + '20' }]}>
                      <IconComponent 
                        name={item.category?.icon || 'cube'} 
                        size={30} 
                        color={item.category?.color || staticColors.primary} 
                      />
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productCategory}>{item.category?.name}</Text>
                    </View>
                  </View>
                  {item.description && (
                    <Text style={styles.productDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.productFooter}>
                    {item.prix && (
                      <Text style={styles.productPrice}>{item.prix} €</Text>
                    )}
                    <View style={styles.quantityBadge}>
                      <Text style={styles.quantityText}>Qté: {item.quantity || 1}</Text>
                    </View>
                  </View>
                  {item.location?.address && (
                    <View style={styles.locationRow}>
                      <FontAwesome name="map-marker" size={12} color="#666" />
                      <Text style={styles.locationText}>{item.location.address}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {item.location?.coordinates && (
                  <TouchableOpacity
                    style={styles.mapButton}
                    onPress={() => navigation.navigate('Carte', {
                      productLocation: {
                        latitude: item.location.coordinates[1],
                        longitude: item.location.coordinates[0]
                      }
                    })}
                  >
                    <FontAwesome name="map" size={16} color="#fff" />
                    <Text style={styles.mapButtonText}>Voir sur la carte</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  headerBanner: {
    backgroundColor: staticColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  headerNom: {
    height: 30,
    width: 120,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    paddingTop: 10,
    backgroundColor: staticColors.background,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderColor: staticColors.border,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    backgroundColor: staticColors.surface,
    fontSize: 16,
    color: staticColors.text,
    shadowColor: staticColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: staticColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: staticColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonText: {
    fontSize: 20,
  },
  listContainer: {
    padding: 8,
  },
  productContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    margin: 8,
    backgroundColor: staticColors.surface,
    borderRadius: 16,
    padding: 15,
    shadowColor: staticColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 150,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  productText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: staticColors.text,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: staticColors.textSecondary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: staticColors.surfaceLight,
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  backButtonText: {
    marginLeft: 8,
    color: staticColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productCard: {
    backgroundColor: staticColors.surface,
    borderRadius: 16,
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    shadowColor: staticColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  productCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  smallIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: staticColors.text,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 13,
    color: staticColors.textSecondary,
  },
  productDescription: {
    fontSize: 14,
    color: staticColors.textSecondary,
    marginBottom: 10,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: staticColors.success,
  },
  quantityBadge: {
    backgroundColor: staticColors.highlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quantityText: {
    fontSize: 12,
    color: staticColors.primary,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: staticColors.border,
  },
  locationText: {
    fontSize: 12,
    color: staticColors.textSecondary,
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: staticColors.textMuted,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: staticColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CataloguePage;
