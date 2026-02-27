// ProductDetailScreen.js - Détail d'un produit
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Share,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../theme/colors';
import { productsAPI, reportsAPI } from '../services/api';

const { width } = Dimensions.get('window');

const ProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params || {};
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const checkAdmin = async () => {
    const adminFlag = await AsyncStorage.getItem('isAdmin');
    setIsAdmin(adminFlag === 'true');
  };

  const handleDeleteProduct = () => {
    Alert.alert(
      'Supprimer le produit',
      `Voulez-vous vraiment supprimer "${product?.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Utiliser adminDelete pour l'admin
              await productsAPI.adminDelete(product._id);
              Alert.alert('Succès', 'Produit supprimé');
              navigation.goBack();
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le produit');
            }
          },
        },
      ]
    );
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(productId);
      if (response.success) {
        setProduct(response.product);
      }
    } catch (error) {
      console.error('Erreur chargement produit:', error);
      Alert.alert('Erreur', 'Impossible de charger le produit');
    } finally {
      setLoading(false);
    }
  };

  const openInAppMap = () => {
    if (product?.location?.coordinates) {
      navigation.navigate('Carte', {
        productLocation: {
          latitude: product.location.coordinates[1],
          longitude: product.location.coordinates[0],
          productName: product.name,
          productId: product._id
        }
      });
    }
  };

  const handleShareProduct = async () => {
    if (!product) return;
    
    try {
      const deepLink = `locprod://product/${product._id}`;
      const webLink = `https://locprod.app/product/${product._id}`;
      
      const message = `🛍️ ${product.name}\n\n` +
        `💰 Prix: ${product.prix ? `${product.prix} €` : 'Gratuit'}\n` +
        `📍 ${product.location?.address || 'Localisation disponible'}\n\n` +
        `${product.description || ''}\n\n` +
        `📲 Ouvrir dans l'app: ${deepLink}\n` +
        `🌐 Ou sur le web: ${webLink}`;
      
      await Share.share({
        message: message,
        title: `LocProd - ${product.name}`,
        url: deepLink,
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'disponible': return colors.success;
      case 'vendu': return colors.error;
      case 'reserve': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const handleReportProduct = () => {
    const reasons = [
      { key: 'inappropriate', label: 'Contenu inapproprié' },
      { key: 'spam', label: 'Spam ou publicité' },
      { key: 'fake', label: 'Fausse information' },
      { key: 'duplicate', label: 'Produit en double' },
      { key: 'expired', label: 'Produit expiré/plus disponible' },
      { key: 'wrong_location', label: 'Mauvaise localisation' },
      { key: 'other', label: 'Autre raison' },
    ];

    Alert.alert(
      'Signaler ce produit',
      'Pourquoi souhaitez-vous signaler ce produit ?',
      [
        ...reasons.map(reason => ({
          text: reason.label,
          onPress: () => submitReport(reason.key),
        })),
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const submitReport = async (reason) => {
    try {
      await reportsAPI.create(product._id, reason);
      Alert.alert('Merci', 'Votre signalement a été envoyé. Notre équipe va l\'examiner.');
    } catch (error) {
      if (error.response?.data?.message) {
        Alert.alert('Information', error.response.data.message);
      } else {
        Alert.alert('Erreur', 'Impossible d\'envoyer le signalement');
      }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-circle" size={60} color={colors.error} />
        <Text style={styles.errorText}>Produit non trouvé</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const IconComponent = product.category?.iconFamily === 'FontAwesome5' ? FontAwesome5 : FontAwesome;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image ou icône */}
      <View style={styles.imageContainer}>
        {product.images && product.images.length > 0 ? (
          <Image source={{ uri: product.images[0] }} style={styles.productImage} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: product.category?.color + '20' }]}>
            <IconComponent 
              name={product.category?.icon || 'cube'} 
              size={80} 
              color={product.category?.color || colors.primary} 
            />
          </View>
        )}
        
        {/* Badge statut */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(product.status)}</Text>
        </View>
      </View>

      {/* Contenu */}
      <View style={styles.content}>
        {/* Catégorie */}
        <View style={styles.categoryRow}>
          <View style={[styles.categoryBadge, { backgroundColor: product.category?.color + '20' }]}>
            <IconComponent 
              name={product.category?.icon || 'cube'} 
              size={14} 
              color={product.category?.color || colors.primary} 
            />
            <Text style={[styles.categoryText, { color: product.category?.color || colors.primary }]}>
              {product.category?.name || 'Sans catégorie'}
            </Text>
          </View>
        </View>

        {/* Nom */}
        <Text style={styles.productName}>{product.name}</Text>

        {/* Prix et quantité */}
        <View style={styles.priceRow}>
          {product.prix && (
            <Text style={styles.price}>{product.prix} €</Text>
          )}
          {product.quantity > 1 && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>Quantité: {product.quantity}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        {/* Localisation */}
        {product.location?.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localisation</Text>
            <TouchableOpacity style={styles.locationCard} onPress={openInAppMap}>
              <View style={styles.locationIcon}>
                <FontAwesome name="map-marker" size={20} color={colors.primary} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationAddress}>{product.location.address}</Text>
                <Text style={styles.locationHint}>Appuyez pour voir sur la carte</Text>
              </View>
              <FontAwesome name="chevron-right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* Informations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <FontAwesome name="calendar" size={16} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Ajouté le</Text>
              <Text style={styles.infoValue}>
                {new Date(product.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            {product.views > 0 && (
              <View style={styles.infoRow}>
                <FontAwesome name="eye" size={16} color={colors.textSecondary} />
                <Text style={styles.infoLabel}>Vues</Text>
                <Text style={styles.infoValue}>{product.views}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bouton voir sur la carte */}
        {product.location?.coordinates && (
          <TouchableOpacity 
            style={styles.mapButton}
            onPress={() => navigation.navigate('Carte', {
              productLocation: {
                latitude: product.location.coordinates[1],
                longitude: product.location.coordinates[0]
              }
            })}
          >
            <FontAwesome name="map" size={18} color={colors.textInverse} />
            <Text style={styles.mapButtonText}>Voir sur la carte</Text>
          </TouchableOpacity>
        )}

        {/* Bouton partager */}
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShareProduct}
        >
          <FontAwesome name="share-alt" size={18} color={colors.primary} />
          <Text style={styles.shareButtonText}>Partager ce produit</Text>
        </TouchableOpacity>

        {/* Bouton signaler */}
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={handleReportProduct}
        >
          <FontAwesome name="flag" size={18} color={colors.warning} />
          <Text style={styles.reportButtonText}>Signaler ce produit</Text>
        </TouchableOpacity>

        {/* Bouton supprimer (Admin uniquement) */}
        {isAdmin && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeleteProduct}
          >
            <FontAwesome name="trash" size={18} color={colors.textInverse} />
            <Text style={styles.deleteButtonText}>Supprimer ce produit</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    marginTop: 15,
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: colors.primary,
    borderRadius: 25,
  },
  backButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    width: width,
    height: 250,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 15,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.success,
  },
  quantityBadge: {
    backgroundColor: colors.highlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quantityText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  locationHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 10,
    gap: 10,
  },
  mapButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 15,
    gap: 10,
  },
  deleteButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  reportButtonText: {
    color: colors.warning,
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  shareButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailScreen;
