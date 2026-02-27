//AjouterProduitScreen.js - Connecté à l'API avec gestion mode invité
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import categories from '../../config/categories';
import { productsAPI } from '../services/api';

const AjouterProduitScreen = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [prix, setPrix] = useState('');
  const [location, setLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    checkGuestMode();
  }, []);

  const checkGuestMode = async () => {
    try {
      const guestMode = await AsyncStorage.getItem('guestMode');
      setIsGuestMode(guestMode === 'true');
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
      Alert.alert('Succès', 'Localisation récupérée!');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer la localisation');
    }
  };

  const selectCategory = (category) => {
    setSelectedCategory(category);
    setModalVisible(false);
  };

  const publierProduit = async () => {
    // Vérifier le mode invité
    if (isGuestMode) {
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
    if (!adresse.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse');
      return;
    }
    if (!location) {
      Alert.alert('Erreur', 'Veuillez récupérer votre localisation');
      return;
    }

    setLoading(true);

    try {
      // Préparer les données pour l'API
      const productData = {
        name: nom.trim(),
        description: description.trim() || undefined,
        prix: prix ? parseFloat(prix) : undefined,
        category: selectedCategory,
        location: {
          coordinates: [location.longitude, location.latitude], // [lng, lat] pour MongoDB
          address: adresse.trim()
        }
      };

      // Appel à l'API
      const response = await productsAPI.create(productData);

      setLoading(false);

      if (response.success) {
        const message = response.isNew 
          ? 'Produit créé avec succès !'
          : `Ce produit existe déjà. Quantité augmentée de 1 (Total: ${response.product.quantity})`;
        
        Alert.alert(
          'Succès',
          message,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setNom('');
                setDescription('');
                setAdresse('');
                setPrix('');
                setSelectedCategory(null);
                setLocation(null);
                
                // Retour à l'écran précédent ou catalogue
                if (navigation) {
                  navigation.goBack();
                }
              }
            }
          ]
        );
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

  return (
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
              <FontAwesome name="th-large" size={30} color="#007AFF" />
              <Text style={styles.selectCategoryText}>Sélectionner une catégorie</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom du Produit</Text>
            <TextInput
              style={styles.input}
              value={nom}
              onChangeText={setNom}
              placeholder="Ex: Tomates fraîches"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre produit..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prix</Text>
            <TextInput
              style={styles.input}
              value={prix}
              onChangeText={setPrix}
              placeholder="Ex: 5.99 €"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Adresse</Text>
            <TextInput
              style={styles.input}
              value={adresse}
              onChangeText={setAdresse}
              placeholder="Ex: 123 Rue de la République"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Localisation</Text>
            <TouchableOpacity style={styles.locationButton} onPress={getLocation}>
              <FontAwesome name="map-marker" size={20} color="#fff" />
              <Text style={styles.locationButtonText}>
                {location ? 'Localisation récupérée ✓' : 'Récupérer ma position'}
              </Text>
            </TouchableOpacity>
            {location && (
              <Text style={styles.locationText}>
                Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
              </Text>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.publishButton, loading && styles.buttonDisabled]} 
            onPress={publierProduit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="check-circle" size={20} color="#fff" />
                <Text style={styles.publishButtonText}>Publier le Produit</Text>
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
                <FontAwesome name="times" size={24} color="#333" />
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
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  categorySection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    backgroundColor: '#F0F8FF',
  },
  selectCategoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
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
    color: '#333',
    marginBottom: 15,
  },
  changeCategoryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  changeCategoryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationButton: {
    flexDirection: 'row',
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  locationText: {
    marginTop: 10,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  publishButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    padding: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
    shadowOpacity: 0.1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    color: '#333',
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
    color: '#333',
    fontWeight: '500',
  },
});

export default AjouterProduitScreen;
