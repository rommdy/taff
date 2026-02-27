// AjouterProduitScreen.js - Ajout de produit avec vérification anti-doublon intelligente
import colors from '../theme/colors';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Modal, 
  FlatList, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';
import categories from '../../config/categories';
import { productsAPI } from '../services/api';

// Token Mapbox pour le geocoding (depuis la config centralisée)
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox';

const AjouterProduitScreen = ({ navigation }) => {
  // États du formulaire
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [prix, setPrix] = useState('');
  const [location, setLocation] = useState(null);
  const [images, setImages] = useState([]); // Tableau d'images
  
  // États UI
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // États pour l'autocomplétion d'adresse
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  
  // États pour la gestion des doublons
  const [similarProducts, setSimilarProducts] = useState([]);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [selectedSimilarProduct, setSelectedSimilarProduct] = useState(null);

  useEffect(() => {
    checkGuestMode();
  }, []);

  const checkGuestMode = async () => {
    try {
      const guestMode = await AsyncStorage.getItem('guestMode');
      const adminFlag = await AsyncStorage.getItem('isAdmin');
      setIsGuestMode(guestMode === 'true');
      setIsAdmin(adminFlag === 'true');
    } catch (error) {
      console.error('Erreur vérification mode invité:', error);
    }
  };

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Impossible d\'accéder à la localisation');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      // Effacer l'adresse textuelle car on utilise la position GPS
      setAdresse('');
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      Alert.alert('Succès', 'Position GPS récupérée ! L\'adresse textuelle a été effacée car vous utilisez votre position actuelle.');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer la localisation');
    }
  };

  const selectCategory = (category) => {
    setSelectedCategory(category);
    setModalVisible(false);
  };

  // Recherche d'adresse avec Mapbox Geocoding API
  const searchAddress = async (text) => {
    setAdresse(text);
    
    if (text.trim().length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    setSearchingAddress(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=fr&limit=5&country=fr`;
      console.log('🔍 Recherche adresse:', text);
      console.log('🔑 Token utilisé:', MAPBOX_ACCESS_TOKEN?.substring(0, 20) + '...');
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📍 Réponse Mapbox:', JSON.stringify(data).substring(0, 200));
      
      if (data.message) {
        console.error('❌ Erreur Mapbox:', data.message);
      }
      
      if (data.features && data.features.length > 0) {
        setAddressSuggestions(data.features);
        setShowAddressSuggestions(true);
        console.log('✅ Suggestions affichées:', data.features.length);
      } else {
        setAddressSuggestions([]);
        setShowAddressSuggestions(false);
        console.log('❌ Aucune suggestion trouvée');
      }
    } catch (error) {
      console.error('Erreur recherche adresse:', error);
      setAddressSuggestions([]);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Sélectionner une suggestion d'adresse
  const selectAddressSuggestion = (suggestion) => {
    setAdresse(suggestion.place_name);
    // La position GPS est automatiquement mise à jour avec les coordonnées de l'adresse
    setLocation({
      latitude: suggestion.center[1],
      longitude: suggestion.center[0],
    });
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    Alert.alert('Adresse sélectionnée', 'La position GPS a été automatiquement mise à jour avec les coordonnées de cette adresse.');
  };

  // Prendre une photo avec la caméra
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à la caméra');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0]]);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  // Sélectionner une image depuis la galerie
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à la galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0]]);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  // Supprimer une image
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  // Afficher le menu de sélection d'image
  const showImagePickerOptions = () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une option',
      [
        {
          text: 'Prendre une photo',
          onPress: takePhoto,
        },
        {
          text: 'Choisir depuis la galerie',
          onPress: pickImage,
        },
        {
          text: 'Annuler',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  // Vérifier les produits similaires quand le nom change
  const handleNomChange = async (text) => {
    setNom(text);
    
    // Vérifier les produits similaires si on a au moins 3 caractères et une catégorie
    if (text.trim().length >= 3 && selectedCategory) {
      setCheckingDuplicate(true);
      try {
        const response = await productsAPI.searchSimilar(text.trim(), selectedCategory.id);
        if (response.success && response.products && response.products.length > 0) {
          setSimilarProducts(response.products);
        } else {
          setSimilarProducts([]);
        }
      } catch (error) {
        console.error('Erreur recherche similaires:', error);
        setSimilarProducts([]);
      } finally {
        setCheckingDuplicate(false);
      }
    } else {
      setSimilarProducts([]);
    }
  };

  // Sélectionner un produit similaire
  const selectSimilarProduct = (product) => {
    setSelectedSimilarProduct(product);
    setNom(product.name);
    setDescription(product.description || '');
    setPrix(product.prix ? product.prix.toString() : '');
    setSimilarProducts([]);
    
    Alert.alert(
      'Produit existant sélectionné',
      `Vous allez ajouter "${product.name}" à un nouveau lieu. Les informations du produit ont été pré-remplies.`,
      [{ text: 'OK' }]
    );
  };

  // Créer un nouveau produit ou ajouter un lieu
  const publierProduit = async () => {
    // Vérifier le mode invité (sauf pour l'admin)
    if (isGuestMode && !isAdmin) {
      Alert.alert(
        'Compte requis',
        'Vous devez créer un compte pour ajouter des produits.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Créer un compte',
            onPress: () => {
              if (navigation) {
                navigation.navigate('SignUp');
              }
            }
          }
        ]
      );
      return;
    }

    // Validation
    if (!nom.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer le nom du produit');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      return;
    }
    // L'adresse et la localisation sont maintenant optionnelles

    setLoading(true);

    try {
      // Vérifier d'abord si le produit existe exactement au même lieu
      const duplicateCheck = await productsAPI.checkDuplicate(
        nom.trim(),
        selectedCategory.id,
        adresse.trim()
      );

      if (duplicateCheck.exists) {
        setLoading(false);
        Alert.alert(
          'Produit déjà existant',
          `Ce produit existe déjà à cette adresse. Voulez-vous augmenter sa quantité ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Augmenter la quantité',
              onPress: () => updateProductQuantity(duplicateCheck.product._id)
            }
          ]
        );
        return;
      }

      // Si on a sélectionné un produit similaire, ajouter juste le lieu
      if (selectedSimilarProduct) {
        const locationData = {
          coordinates: [location.longitude, location.latitude],
          address: adresse.trim(),
          images: images.map(img => img.uri) // Ajouter les URIs des images
        };

        const response = await productsAPI.addLocation(selectedSimilarProduct._id, locationData);
        
        setLoading(false);

        if (response.success) {
          Alert.alert(
            'Succès',
            `Le lieu a été ajouté au produit "${selectedSimilarProduct.name}"`,
            [
              {
                text: 'OK',
                onPress: () => resetForm()
              }
            ]
          );
        }
      } else {
        // Créer un nouveau produit
        // Si localisation GPS disponible mais pas d'adresse, utiliser les coordonnées comme adresse
        const locationAddress = adresse.trim() || (location ? `Position GPS: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : '');
        
        const productData = {
          name: nom.trim(),
          description: description.trim() || undefined,
          prix: prix ? parseFloat(prix) : undefined,
          category: selectedCategory,
          location: location ? {
            coordinates: [location.longitude, location.latitude],
            address: locationAddress
          } : null,
          images: images.map(img => img.uri) // Ajouter les URIs des images
        };

        const response = await productsAPI.create(productData);

        setLoading(false);

        if (response.success) {
          Alert.alert(
            'Succès',
            'Produit créé avec succès !',
            [
              {
                text: 'OK',
                onPress: () => resetForm()
              }
            ]
          );
        }
      }
    } catch (error) {
      setLoading(false);
      console.error('Erreur lors de la publication:', error);

      let errorMessage = 'Une erreur est survenue lors de la publication';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Erreur', errorMessage);
    }
  };

  const updateProductQuantity = async (productId) => {
    setLoading(true);
    try {
      // Logique pour augmenter la quantité (à implémenter côté backend)
      const response = await productsAPI.update(productId, { incrementQuantity: true });
      
      setLoading(false);

      if (response.success) {
        Alert.alert(
          'Succès',
          'La quantité du produit a été augmentée',
          [
            {
              text: 'OK',
              onPress: () => resetForm()
            }
          ]
        );
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Erreur', 'Impossible de mettre à jour le produit');
    }
  };

  const resetForm = () => {
    setNom('');
    setDescription('');
    setAdresse('');
    setPrix('');
    setSelectedCategory(null);
    setLocation(null);
    setImages([]);
    setSimilarProducts([]);
    setSelectedSimilarProduct(null);
    
    if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.title}>Ajouter un Produit</Text>
          
          {/* Section Catégorie */}
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Catégorie du produit</Text>
            {selectedCategory ? (
              <View style={styles.selectedCategoryContainer}>
                <View style={[styles.selectedIconContainer, { backgroundColor: selectedCategory.color + '30' }]}>
                  {selectedCategory.iconFamily === 'FontAwesome5' ? (
                    <FontAwesome5 name={selectedCategory.icon} size={60} color={selectedCategory.color} />
                  ) : (
                    <FontAwesome name={selectedCategory.icon} size={60} color={selectedCategory.color} />
                  )}
                </View>
                <Text style={styles.selectedCategoryName}>{selectedCategory.name}</Text>
                <TouchableOpacity style={styles.changeCategoryButton} onPress={() => setModalVisible(true)}>
                  <Text style={styles.changeCategoryText}>Changer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.selectCategoryButton} onPress={() => setModalVisible(true)}>
                <FontAwesome name="th-large" size={30} color={colors.primary} />
                <Text style={styles.selectCategoryText}>Sélectionner une catégorie</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Nom du Produit / Marque</Text>
                {checkingDuplicate && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </View>
              <TextInput
                style={styles.input}
                value={nom}
                onChangeText={handleNomChange}
                placeholder="Ex: Tomates fraîches, Coca-Cola..."
                placeholderTextColor={colors.textMuted}
              />
              
              {/* Afficher les produits similaires */}
              {similarProducts.length > 0 && (
                <View style={styles.similarProductsContainer}>
                  <Text style={styles.similarProductsTitle}>
                    <FontAwesome name="info-circle" size={14} color={colors.warning} /> Produits similaires trouvés :
                  </Text>
                  {similarProducts.map((product) => (
                    <TouchableOpacity
                      key={product._id}
                      style={styles.similarProductItem}
                      onPress={() => selectSimilarProduct(product)}
                    >
                      <View style={styles.similarProductInfo}>
                        <Text style={styles.similarProductName}>{product.name}</Text>
                        <Text style={styles.similarProductCategory}>{product.category.name}</Text>
                      </View>
                      <FontAwesome name="chevron-right" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.similarProductsHint}>
                    Appuyez sur un produit pour ajouter uniquement un nouveau lieu
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez votre produit..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prix (optionnel)</Text>
              <TextInput
                style={styles.input}
                value={prix}
                onChangeText={setPrix}
                placeholder="Ex: 5.99"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Section Photos */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Photos du produit (optionnel)</Text>
              
              {/* Galerie de photos */}
              {images.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageGallery}
                >
                  {images.map((image, index) => (
                    <View key={index} style={styles.imageContainer}>
                      <Image source={{ uri: image.uri }} style={styles.productImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <FontAwesome name="times-circle" size={24} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Bouton ajouter photo */}
              {images.length < 5 && (
                <TouchableOpacity 
                  style={styles.addPhotoButton} 
                  onPress={showImagePickerOptions}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <>
                      <FontAwesome name="camera" size={24} color={colors.primary} />
                      <Text style={styles.addPhotoText}>
                        {images.length === 0 ? 'Ajouter une photo' : 'Ajouter une autre photo'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              {images.length >= 5 && (
                <Text style={styles.maxPhotosText}>Maximum 5 photos atteint</Text>
              )}
            </View>

            <View style={[styles.inputGroup, { zIndex: 100 }]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Adresse / Lieu (optionnel)</Text>
                {searchingAddress && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </View>
              <TextInput
                style={styles.input}
                value={adresse}
                onChangeText={searchAddress}
                placeholder="Ex: Carrefour, 123 Rue de la République"
                placeholderTextColor={colors.textMuted}
              />
              
              {/* Suggestions d'adresse */}
              {showAddressSuggestions && addressSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  {addressSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={suggestion.id || index}
                      style={styles.suggestionItem}
                      onPress={() => selectAddressSuggestion(suggestion)}
                    >
                      <FontAwesome name="map-marker" size={16} color={colors.primary} style={styles.suggestionIcon} />
                      <View style={styles.suggestionTextContainer}>
                        <Text style={styles.suggestionText} numberOfLines={1}>
                          {suggestion.text}
                        </Text>
                        <Text style={styles.suggestionSubtext} numberOfLines={1}>
                          {suggestion.place_name}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Localisation GPS (optionnel)</Text>
              <TouchableOpacity style={styles.locationButton} onPress={getLocation}>
                <FontAwesome name="map-marker" size={20} color={colors.white} />
                <Text style={styles.locationButtonText}>
                  {location ? 'Localisation récupérée ✓' : 'Récupérer ma position'}
                </Text>
              </TouchableOpacity>
              {location && (
                <Text style={styles.locationText}>
                  Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                </Text>
              )}
              <Text style={styles.locationHint}>
                ⚠️ Choisissez UNE des deux options : sélectionnez une adresse (la position GPS sera automatique) OU récupérez votre position GPS (l'adresse sera effacée).
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.publishButton, loading && styles.buttonDisabled]} 
              onPress={publierProduit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <FontAwesome name="check-circle" size={20} color={colors.white} />
                  <Text style={styles.publishButtonText}>
                    {selectedSimilarProduct ? 'Ajouter le lieu' : 'Créer le produit'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal de sélection de catégorie */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choisir une catégorie</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <FontAwesome name="times" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                contentContainerStyle={styles.modalList}
                renderItem={({ item }) => {
                  const IconComponent = item.iconFamily === 'FontAwesome5' ? FontAwesome5 : FontAwesome;
                  return (
                    <TouchableOpacity
                      style={styles.modalCategoryItem}
                      onPress={() => selectCategory(item)}
                    >
                      <View style={[styles.modalIconContainer, { backgroundColor: item.color + '20' }]}>
                        <IconComponent name={item.icon} size={30} color={item.color} />
                      </View>
                      <Text style={styles.modalCategoryText}>{item.name}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  categorySection: {
    backgroundColor: colors.background,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  selectCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceLight,
  },
  selectCategoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 10,
  },
  selectedCategoryContainer: {
    alignItems: 'center',
    padding: 20,
  },
  selectedIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectedCategoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  changeCategoryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  changeCategoryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  similarProductsContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  similarProductsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
    marginBottom: 10,
  },
  similarProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  similarProductInfo: {
    flex: 1,
  },
  similarProductName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  similarProductCategory: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  similarProductsHint: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: 5,
  },
  locationButton: {
    flexDirection: 'row',
    backgroundColor: colors.warning,
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  locationText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  locationHint: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: 250,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  suggestionSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  publishButton: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    padding: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  publishButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
    shadowOpacity: 0.1,
  },
  // Styles pour les photos
  imageGallery: {
    marginBottom: 15,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceLight,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 10,
  },
  maxPhotosText: {
    fontSize: 14,
    color: colors.warning,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalList: {
    padding: 10,
  },
  modalCategoryItem: {
    flex: 1,
    alignItems: 'center',
    margin: 8,
    padding: 10,
  },
  modalIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCategoryText: {
    fontSize: 11,
    textAlign: 'center',
    color: colors.text,
    fontWeight: '500',
  },
});

export default AjouterProduitScreen;
