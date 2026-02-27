import React, { useEffect, useState, useRef, useCallback } from 'react';
import { lightTheme as staticColors } from '../theme/colors';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert, TextInput, ScrollView, Keyboard } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import * as Location from 'expo-location';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { productsAPI, roadEventsAPI } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE_URL, MAPBOX_STYLE_URL_DARK } from '../../config/mapbox';
import { useTheme } from '../context/ThemeContext';

// Configurer le token Mapbox
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

const MapComponent = ({ navigation, route }) => {
  const { isDarkMode, colors: themeColors } = useTheme();
  const colors = themeColors || staticColors;
  const mapStyleUrl = isDarkMode ? MAPBOX_STYLE_URL_DARK : MAPBOX_STYLE_URL;
  
  const [currentLocation, setCurrentLocation] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const cameraRef = useRef(null);
  const locationSubscription = useRef(null);
  
  // États pour la recherche d'adresse
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Mode de transport (driving, walking, cycling)
  const [transportMode, setTransportMode] = useState('driving');
  
  // États pour les instructions de navigation
  const [navigationSteps, setNavigationSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const lastSpokenStep = useRef(-1);
  
  // État pour la prévisualisation de l'itinéraire
  const [routePreview, setRoutePreview] = useState(null);
  
  // États pour les événements routiers
  const [roadEvents, setRoadEvents] = useState([]);
  const [showEventMenu, setShowEventMenu] = useState(false);

  useEffect(() => {
    initializeMap();
  }, []);

  // Recharger les produits quand on revient sur la carte (sans les événements pour éviter rate limit)
  useFocusEffect(
    useCallback(() => {
      if (currentLocation) {
        loadNearbyProducts(currentLocation.latitude, currentLocation.longitude);
      }
    }, [currentLocation])
  );

  // Recentrage automatique toutes les 30 secondes en mode navigation
  useEffect(() => {
    let intervalId;
    
    if (isNavigating && currentLocation) {
      intervalId = setInterval(() => {
        if (cameraRef.current && currentLocation) {
          cameraRef.current.setCamera({
            centerCoordinate: [currentLocation.longitude, currentLocation.latitude],
            zoomLevel: 17,
            pitch: 60,
            animationMode: 'flyTo',
            animationDuration: 800,
          });
        }
      }, 30000); // 30 secondes
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isNavigating, currentLocation]);

  // Lancer l'itinéraire si passé en paramètre (sans recentrer sur la destination)
  useEffect(() => {
    if (route?.params?.productLocation && currentLocation) {
      const { latitude, longitude, productName, productId } = route.params.productLocation;

      // Lancer automatiquement le calcul d'itinéraire
      const fakeProduct = {
        _id: productId || 'destination',
        name: productName || 'Destination',
        location: { latitude, longitude }
      };
      
      // Petit délai pour laisser la carte se charger
      setTimeout(() => {
        previewRoute(fakeProduct);
      }, 500);
    }
  }, [route?.params?.productLocation, currentLocation]);

  const initializeMap = async () => {
    try {
      // Demander la permission de localisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Impossible d\'accéder à la localisation');
        setLoading(false);
        return;
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });

      // Charger les produits à proximité (avec loading pour l'init)
      await loadNearbyProducts(latitude, longitude, 10000, true);
      
      // Charger les événements routiers (une seule fois à l'init)
      loadRoadEvents(latitude, longitude);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      Alert.alert('Erreur', 'Impossible de charger la carte');
      setLoading(false);
    }
  };

  const loadNearbyProducts = async (latitude, longitude, maxDistance = 10000, showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const response = await productsAPI.searchNearby(latitude, longitude, maxDistance);
      if (response.success) {
        // Convertir les coordonnées MongoDB [lng, lat] en {latitude, longitude}
        const formattedProducts = (response.products || []).map(product => ({
          ...product,
          location: {
            latitude: product.location.coordinates[1],
            longitude: product.location.coordinates[0],
            address: product.location.address
          }
        }));
        setProducts(formattedProducts);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Charger les événements routiers à proximité
  const loadRoadEvents = async (latitude, longitude) => {
    try {
      const response = await roadEventsAPI.getNearby(latitude, longitude, 10000);
      if (response.success) {
        const formattedEvents = (response.events || []).map(event => ({
          ...event,
          latitude: event.location.coordinates[1],
          longitude: event.location.coordinates[0]
        }));
        setRoadEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Erreur chargement événements routiers:', error);
    }
  };

  // Créer un événement routier
  const createRoadEvent = async (type) => {
    if (!currentLocation) {
      Alert.alert('Erreur', 'Position non disponible');
      return;
    }

    try {
      const response = await roadEventsAPI.create(
        type,
        currentLocation.longitude,
        currentLocation.latitude
      );
      
      if (response.success) {
        const typeLabels = {
          police: '👮 Police',
          accident: '🚗 Accident',
          traffic: '🚦 Bouchon',
          hazard: '⚠️ Danger',
          roadwork: '🚧 Travaux'
        };
        Alert.alert('Signalement envoyé', `${typeLabels[type]} signalé avec succès !`);
        loadRoadEvents(currentLocation.latitude, currentLocation.longitude);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer le signalement');
    }
    setShowEventMenu(false);
  };

  // Confirmer ou rejeter un événement
  const handleEventAction = async (event, action) => {
    try {
      if (action === 'confirm') {
        await roadEventsAPI.confirm(event._id);
        Alert.alert('Merci !', 'Événement confirmé');
      } else {
        await roadEventsAPI.dismiss(event._id);
        Alert.alert('Merci !', 'Signalement pris en compte');
      }
      loadRoadEvents(currentLocation.latitude, currentLocation.longitude);
    } catch (error) {
      Alert.alert('Erreur', error.response?.data?.message || 'Action impossible');
    }
  };

  // Obtenir l'icône et la couleur pour un type d'événement
  const getEventStyle = (type) => {
    switch(type) {
      case 'police':
        return { icon: 'shield', color: '#3498db', label: 'Police' };
      case 'accident':
        return { icon: 'car', color: '#e74c3c', label: 'Accident' };
      case 'traffic':
        return { icon: 'road', color: '#f39c12', label: 'Bouchon' };
      case 'hazard':
        return { icon: 'exclamation-triangle', color: '#e67e22', label: 'Danger' };
      case 'roadwork':
        return { icon: 'wrench', color: '#9b59b6', label: 'Travaux' };
      default:
        return { icon: 'info-circle', color: '#95a5a6', label: 'Info' };
    }
  };

  // Recherche d'adresse avec Mapbox Geocoding API
  const searchAddress = async (text) => {
    setSearchQuery(text);
    
    if (text.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=fr&limit=5`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setSearchResults(data.features);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Erreur recherche adresse:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Effacer la recherche
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    Keyboard.dismiss();
  };

  // Sélectionner une adresse et lancer la navigation
  const selectSearchResult = (result) => {
    const [longitude, latitude] = result.center;
    
    Keyboard.dismiss();
    setSearchQuery(result.place_name);
    setSearchResults([]);
    setShowSearchResults(false);
    
    // Centrer la caméra sur l'adresse
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 16,
        pitch: 45,
        animationDuration: 1500,
      });
    }

    const fakeDestination = {
      _id: 'search-destination',
      name: result.place_name,
      location: { latitude, longitude }
    };
    
    setTimeout(() => {
      previewRoute(fakeDestination);
    }, 1000);
  };

  // Gérer l'appui long sur la carte pour naviguer vers ce point
  const handleMapLongPress = async (event) => {
    const { geometry } = event;
    if (!geometry || !geometry.coordinates) return;
    
    const [longitude, latitude] = geometry.coordinates;
    
    // Obtenir le nom de l'adresse via reverse geocoding
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=fr&limit=1`;
      const response = await fetch(url);
      const data = await response.json();
      
      const placeName = data.features?.[0]?.place_name || 'Destination';
      const shortName = data.features?.[0]?.text || 'Point sélectionné';
      
      Alert.alert(
        'Naviguer vers ce point ?',
        placeName,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Y aller',
            onPress: () => {
              const destination = {
                _id: 'longpress-destination',
                name: shortName,
                location: { latitude, longitude }
              };
              previewRoute(destination);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur reverse geocoding:', error);
      // Lancer quand même la navigation sans le nom
      const destination = {
        _id: 'longpress-destination',
        name: 'Destination',
        location: { latitude, longitude }
      };
      previewRoute(destination);
    }
  };

  const centerOnUserLocation = async () => {
    try {
      // Désactiver la navigation pour permettre le recentrage manuel
      if (isNavigating) {
        setIsNavigating(false);
      }
      
      // Obtenir la position actuelle rapidement
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;
      setCurrentLocation({ latitude, longitude });
      
      // Petit délai pour que le state se mette à jour
      setTimeout(() => {
        if (cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: [longitude, latitude],
            zoomLevel: 16,
            pitch: 45,
            heading: 0,
            animationMode: 'flyTo',
            animationDuration: 800,
          });
        }
      }, 100);
      
      // Recharger les produits à proximité (sans loading)
      loadNearbyProducts(latitude, longitude);
    } catch (error) {
      console.error('Erreur lors de la récupération de la position :', error);
      Alert.alert('Erreur', 'Impossible de récupérer votre position');
    }
  };

  const handleMarkerPress = (product) => {
    if (navigation) {
      navigation.navigate('ProductDetail', { productId: product._id });
    }
  };

  // Fonction pour récupérer l'itinéraire via Mapbox Directions API
  const getRoute = async (startCoords, endCoords, mode = transportMode) => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${startCoords[0]},${startCoords[1]};${endCoords[0]},${endCoords[1]}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates;
        const duration = Math.round(route.duration / 60); // en minutes
        const distance = (route.distance / 1000).toFixed(1); // en km
        
        return {
          coordinates,
          duration,
          distance,
          steps: route.legs[0]?.steps || [],
          mode
        };
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'itinéraire:', error);
      return null;
    }
  };

  // Changer le mode de transport et recalculer l'itinéraire
  const changeTransportMode = async (newMode) => {
    setTransportMode(newMode);
    
    if (isNavigating && destination && currentLocation) {
      const startCoords = [currentLocation.longitude, currentLocation.latitude];
      const endCoords = [destination.location.longitude, destination.location.latitude];
      
      const routeData = await getRoute(startCoords, endCoords, newMode);
      if (routeData) {
        setRouteCoordinates(routeData.coordinates);
        setRouteInfo({
          duration: routeData.duration,
          distance: routeData.distance,
          productName: destination.name,
          mode: newMode
        });
      }
    }
  };

  // Traduire les instructions Mapbox en français
  const translateInstruction = (step) => {
    const maneuver = step.maneuver;
    const distance = step.distance < 1000 
      ? `${Math.round(step.distance)} mètres` 
      : `${(step.distance / 1000).toFixed(1)} kilomètres`;
    
    const modifierMap = {
      'left': 'à gauche',
      'right': 'à droite',
      'sharp left': 'fortement à gauche',
      'sharp right': 'fortement à droite',
      'slight left': 'légèrement à gauche',
      'slight right': 'légèrement à droite',
      'straight': 'tout droit',
      'uturn': 'demi-tour'
    };
    
    const typeMap = {
      'turn': 'Tournez',
      'depart': 'Partez',
      'arrive': 'Vous êtes arrivé',
      'merge': 'Rejoignez',
      'fork': 'Prenez',
      'roundabout': 'Au rond-point',
      'rotary': 'Au rond-point',
      'continue': 'Continuez',
      'new name': 'Continuez sur',
      'end of road': 'En fin de route'
    };
    
    const type = typeMap[maneuver.type] || 'Continuez';
    const modifier = modifierMap[maneuver.modifier] || '';
    const streetName = step.name ? ` sur ${step.name}` : '';
    
    if (maneuver.type === 'arrive') {
      return 'Vous êtes arrivé à destination';
    }
    
    if (maneuver.type === 'depart') {
      return `Partez vers ${modifier || 'le nord'}${streetName}. ${distance}`;
    }
    
    return `${type} ${modifier}${streetName}. ${distance}`;
  };

  // Annoncer une instruction (voix désactivée - nécessite development build)
  const speakInstruction = (text) => {
    // La synthèse vocale nécessite expo-speech qui requiert un development build
    // Pour l'instant, on affiche seulement les instructions visuellement
    console.log('📢 Instruction:', text);
  };

  // Prévisualiser l'itinéraire avant de lancer la navigation
  const previewRoute = async (product) => {
    if (!currentLocation) {
      Alert.alert('Erreur', 'Position actuelle non disponible');
      return;
    }

    const startCoords = [currentLocation.longitude, currentLocation.latitude];
    const endCoords = [product.location.longitude, product.location.latitude];

    const routeData = await getRoute(startCoords, endCoords);
    
    if (routeData) {
      setRouteCoordinates(routeData.coordinates);
      setRoutePreview({
        product: product,
        duration: routeData.duration,
        distance: routeData.distance,
        coordinates: routeData.coordinates,
        steps: routeData.steps
      });

      // Ajuster la caméra pour voir tout l'itinéraire
      if (cameraRef.current) {
        const allCoords = routeData.coordinates;
        const lngs = allCoords.map(c => c[0]);
        const lats = allCoords.map(c => c[1]);
        const bounds = {
          ne: [Math.max(...lngs), Math.max(...lats)],
          sw: [Math.min(...lngs), Math.min(...lats)]
        };
        cameraRef.current.fitBounds(bounds.ne, bounds.sw, 80, 1000);
      }
    } else {
      Alert.alert('Erreur', 'Impossible de calculer l\'itinéraire');
    }
  };

  // Confirmer et démarrer la navigation
  const confirmNavigation = () => {
    if (!routePreview) return;
    
    const product = routePreview.product;
    setRoutePreview(null);
    startNavigation(product, true);
  };

  // Annuler la prévisualisation
  const cancelPreview = () => {
    setRoutePreview(null);
    setRouteCoordinates([]);
  };

  // Démarrer la navigation vers un produit
  const startNavigation = async (product, skipPreview = false) => {
    if (!currentLocation) {
      Alert.alert('Erreur', 'Position actuelle non disponible');
      return;
    }

    setIsNavigating(true);
    setDestination(product);
    setCurrentStepIndex(0);
    lastSpokenStep.current = -1;

    const startCoords = [currentLocation.longitude, currentLocation.latitude];
    const endCoords = [product.location.longitude, product.location.latitude];

    const routeData = await getRoute(startCoords, endCoords);
    
    if (routeData) {
      setRouteCoordinates(routeData.coordinates);
      setRouteInfo({
        duration: routeData.duration,
        distance: routeData.distance,
        productName: product.name
      });
      
      // Stocker les étapes traduites
      const translatedSteps = routeData.steps.map(step => ({
        ...step,
        instruction: translateInstruction(step),
        maneuverLocation: step.maneuver.location
      }));
      setNavigationSteps(translatedSteps);
      
      // Annoncer la première instruction
      if (translatedSteps.length > 0) {
        speakInstruction(`Navigation démarrée vers ${product.name}. ${translatedSteps[0].instruction}`);
      }

      // Ajuster la caméra pour voir tout l'itinéraire
      if (cameraRef.current) {
        const allCoords = routeData.coordinates;
        const lngs = allCoords.map(c => c[0]);
        const lats = allCoords.map(c => c[1]);
        const bounds = {
          ne: [Math.max(...lngs), Math.max(...lats)],
          sw: [Math.min(...lngs), Math.min(...lats)]
        };
        cameraRef.current.fitBounds(bounds.ne, bounds.sw, 80, 1000);
      }

      // Suivre la position en temps réel
      startLocationTracking();
    } else {
      Alert.alert('Erreur', 'Impossible de calculer l\'itinéraire');
      setIsNavigating(false);
    }
  };

  // Suivre la position en temps réel pendant la navigation
  const startLocationTracking = async () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 3,
      },
      async (location) => {
        const { latitude, longitude } = location.coords;
        setCurrentLocation({ latitude, longitude });

        // Vérifier les étapes de navigation et annoncer
        if (navigationSteps.length > 0) {
          for (let i = currentStepIndex; i < navigationSteps.length; i++) {
            const step = navigationSteps[i];
            if (step.maneuverLocation) {
              const distanceToStep = calculateDistance(
                latitude, longitude,
                step.maneuverLocation[1], step.maneuverLocation[0]
              ) * 1000; // en mètres
              
              // Annoncer l'étape quand on est à moins de 50m
              if (distanceToStep < 50 && lastSpokenStep.current < i) {
                lastSpokenStep.current = i;
                setCurrentStepIndex(i);
                speakInstruction(step.instruction);
                break;
              }
            }
          }
        }

        // Mettre à jour l'itinéraire si on s'éloigne trop
        if (destination) {
          // Vérifier si on est arrivé (moins de 50m)
          const distanceToDestination = calculateDistance(
            latitude, longitude,
            destination.location.latitude, destination.location.longitude
          );
          
          if (distanceToDestination < 0.05) { // 50 mètres
            speakInstruction('Vous êtes arrivé à destination');
            Alert.alert('Arrivé !', `Vous êtes arrivé à ${destination.name}`);
            stopNavigation();
            return;
          }
        }
      }
    );
  };

  // Calculer la distance entre deux points (en km)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Arrêter la navigation
  const stopNavigation = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsNavigating(false);
    setRouteCoordinates(null);
    setDestination(null);
    setRouteInfo(null);
  };

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={staticColors.primary} />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentLocation && (
        <>
          {/* Barre de recherche d'adresse */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <FontAwesome name="search" size={18} color={staticColors.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une adresse..."
                placeholderTextColor={staticColors.textMuted}
                value={searchQuery}
                onChangeText={searchAddress}
                returnKeyType="search"
              />
              {isSearching && (
                <ActivityIndicator size="small" color={staticColors.primary} style={styles.searchLoader} />
              )}
              {searchQuery.length > 0 && !isSearching && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <FontAwesome name="times-circle" size={18} color={staticColors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Résultats de recherche */}
            {showSearchResults && searchResults.length > 0 && (
              <ScrollView style={styles.searchResultsContainer} keyboardShouldPersistTaps="handled">
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={result.id || index}
                    style={styles.searchResultItem}
                    onPress={() => selectSearchResult(result)}
                  >
                    <FontAwesome name="map-marker" size={16} color={staticColors.primary} style={styles.resultIcon} />
                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {result.text || result.place_name.split(',')[0]}
                      </Text>
                      <Text style={styles.resultSubtitle} numberOfLines={1}>
                        {result.place_name}
                      </Text>
                    </View>
                    <FontAwesome name="arrow-right" size={14} color={staticColors.textMuted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          <Mapbox.MapView
            style={styles.map}
            styleURL={mapStyleUrl}
            zoomEnabled={true}
            scrollEnabled={true}
            pitchEnabled={true}
            rotateEnabled={true}
            onLongPress={handleMapLongPress}
          >
            <Mapbox.Camera
              ref={cameraRef}
              zoomLevel={16}
              pitch={isNavigating ? 60 : 45}
              centerCoordinate={isNavigating ? undefined : [currentLocation.longitude, currentLocation.latitude]}
              animationMode="flyTo"
              animationDuration={1000}
              followUserLocation={isNavigating}
              followUserMode={isNavigating ? "compass" : "normal"}
              followZoomLevel={isNavigating ? 17 : 16}
              followPitch={isNavigating ? 60 : 45}
            />
            
            {/* Suivi de la position utilisateur natif Mapbox */}
            <Mapbox.UserLocation
              visible={true}
              showsUserHeadingIndicator={true}
              animated={true}
            />

            {/* Couche 3D des bâtiments */}
            <Mapbox.VectorSource
              id="composite"
              url="mapbox://mapbox.mapbox-streets-v8"
            >
              <Mapbox.FillExtrusionLayer
                id="3d-buildings"
                sourceLayerID="building"
                minZoomLevel={14}
                style={{
                  fillExtrusionColor: '#aaa',
                  fillExtrusionHeight: ['get', 'height'],
                  fillExtrusionBase: ['get', 'min_height'],
                  fillExtrusionOpacity: 0.6,
                }}
                filter={['==', 'extrude', 'true']}
              />
            </Mapbox.VectorSource>

            {/* Marqueur de la position actuelle */}
            <Mapbox.PointAnnotation
              id="userLocation"
              coordinate={[currentLocation.longitude, currentLocation.latitude]}
            >
              <View style={[styles.customMarker, { backgroundColor: staticColors.primary }]}>
                <FontAwesome name="crosshairs" size={20} color="#fff" />
              </View>
            </Mapbox.PointAnnotation>

            {/* Ligne de l'itinéraire */}
            {routeCoordinates && (
              <Mapbox.ShapeSource
                id="routeSource"
                shape={{
                  type: 'Feature',
                  geometry: {
                    type: 'LineString',
                    coordinates: routeCoordinates,
                  },
                }}
              >
                <Mapbox.LineLayer
                  id="routeLine"
                  style={{
                    lineColor: '#FF6B9D',
                    lineWidth: 5,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              </Mapbox.ShapeSource>
            )}

            {/* Marqueur de destination */}
            {destination && (
              <Mapbox.PointAnnotation
                id="destination"
                coordinate={[destination.location.longitude, destination.location.latitude]}
              >
                <View style={[styles.destinationMarker]}>
                  <FontAwesome name="flag-checkered" size={24} color="#fff" />
                </View>
              </Mapbox.PointAnnotation>
            )}

            {/* Marqueurs des événements routiers */}
            {roadEvents.map((event) => {
              const eventStyle = getEventStyle(event.type);
              return (
                <Mapbox.PointAnnotation
                  key={event._id}
                  id={`event-${event._id}`}
                  coordinate={[event.longitude, event.latitude]}
                >
                  <View style={[styles.eventMarker, { backgroundColor: eventStyle.color }]}>
                    <FontAwesome name={eventStyle.icon} size={16} color="#fff" />
                  </View>
                  <Mapbox.Callout title={eventStyle.label}>
                    <View style={styles.eventCallout}>
                      <Text style={styles.eventCalloutTitle}>{eventStyle.label}</Text>
                      <Text style={styles.eventCalloutConfirm}>
                        {event.confirmations} confirmation{event.confirmations > 1 ? 's' : ''}
                      </Text>
                      <View style={styles.eventActions}>
                        <TouchableOpacity 
                          style={styles.eventConfirmButton}
                          onPress={() => handleEventAction(event, 'confirm')}
                        >
                          <FontAwesome name="thumbs-up" size={14} color="#fff" />
                          <Text style={styles.eventActionText}>Oui</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.eventDismissButton}
                          onPress={() => handleEventAction(event, 'dismiss')}
                        >
                          <FontAwesome name="thumbs-down" size={14} color="#fff" />
                          <Text style={styles.eventActionText}>Non</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Mapbox.Callout>
                </Mapbox.PointAnnotation>
              );
            }
            )}

            {/* Marqueurs des produits */}
            {products.map((product) => {
              const IconComponent = product.category?.iconFamily === 'FontAwesome5' ? FontAwesome5 : FontAwesome;
              return (
                <Mapbox.PointAnnotation
                  key={product._id}
                  id={product._id}
                  coordinate={[product.location.longitude, product.location.latitude]}
                  onSelected={() => handleMarkerPress(product)}
                >
                  <View style={[styles.customMarker, { backgroundColor: product.category?.color || staticColors.primary }]}>
                    <IconComponent name={product.category?.icon || 'cube'} size={20} color="#fff" />
                  </View>
                  <Mapbox.Callout title={product.name}>
                    <View style={styles.calloutContainer}>
                      <Text style={styles.calloutTitle}>{product.name}</Text>
                      <Text style={styles.calloutCategory}>{product.category?.name}</Text>
                      {product.prix && (
                        <Text style={styles.calloutPrice}>{product.prix} €</Text>
                      )}
                      <Text style={styles.calloutQuantity}>Quantité: {product.quantity || 1}</Text>
                      {product.location?.address && (
                        <Text style={styles.calloutAddress}>{product.location.address}</Text>
                      )}
                      <TouchableOpacity 
                        style={styles.navigateButton}
                        onPress={() => previewRoute(product)}
                      >
                        <FontAwesome name="location-arrow" size={14} color="#fff" />
                        <Text style={styles.navigateButtonText}>Y aller</Text>
                      </TouchableOpacity>
                    </View>
                  </Mapbox.Callout>
                </Mapbox.PointAnnotation>
              );
            })}
          </Mapbox.MapView>

          {/* Panneau de prévisualisation de l'itinéraire */}
          {routePreview && !isNavigating && (
            <View style={styles.previewPanel}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewTitle}>📍 {routePreview.product.name}</Text>
                <TouchableOpacity onPress={cancelPreview} style={styles.previewCloseButton}>
                  <FontAwesome name="times" size={20} color={staticColors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.previewStats}>
                <View style={styles.previewStat}>
                  <FontAwesome name="clock-o" size={24} color={staticColors.primary} />
                  <Text style={styles.previewStatValue}>{routePreview.duration} min</Text>
                  <Text style={styles.previewStatLabel}>Durée</Text>
                </View>
                <View style={styles.previewStatDivider} />
                <View style={styles.previewStat}>
                  <FontAwesome name="road" size={24} color={staticColors.primary} />
                  <Text style={styles.previewStatValue}>{routePreview.distance} km</Text>
                  <Text style={styles.previewStatLabel}>Distance</Text>
                </View>
              </View>

              {/* Sélection du mode de transport */}
              <View style={styles.transportModes}>
                <TouchableOpacity 
                  style={[styles.transportModeButton, transportMode === 'walking' && styles.transportModeActive]}
                  onPress={() => setTransportMode('walking')}
                >
                  <FontAwesome name="male" size={20} color={transportMode === 'walking' ? '#fff' : staticColors.text} />
                  <Text style={[styles.transportModeText, transportMode === 'walking' && styles.transportModeTextActive]}>Piéton</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.transportModeButton, transportMode === 'cycling' && styles.transportModeActive]}
                  onPress={() => setTransportMode('cycling')}
                >
                  <FontAwesome name="bicycle" size={20} color={transportMode === 'cycling' ? '#fff' : staticColors.text} />
                  <Text style={[styles.transportModeText, transportMode === 'cycling' && styles.transportModeTextActive]}>Vélo</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.transportModeButton, transportMode === 'driving' && styles.transportModeActive]}
                  onPress={() => setTransportMode('driving')}
                >
                  <FontAwesome name="car" size={20} color={transportMode === 'driving' ? '#fff' : staticColors.text} />
                  <Text style={[styles.transportModeText, transportMode === 'driving' && styles.transportModeTextActive]}>Voiture</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.previewButtons}>
                <TouchableOpacity style={styles.previewCancelButton} onPress={cancelPreview}>
                  <Text style={styles.previewCancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.previewGoButton} onPress={confirmNavigation}>
                  <FontAwesome name="location-arrow" size={18} color="#fff" />
                  <Text style={styles.previewGoButtonText}>Y aller</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Panneau d'information de navigation */}
          {isNavigating && routeInfo && (
            <View style={styles.navigationPanel}>
              {/* Sélection du mode de transport */}
              <View style={styles.transportModes}>
                <TouchableOpacity 
                  style={[styles.transportModeButton, transportMode === 'walking' && styles.transportModeActive]}
                  onPress={() => changeTransportMode('walking')}
                >
                  <FontAwesome name="male" size={20} color={transportMode === 'walking' ? '#fff' : staticColors.text} />
                  <Text style={[styles.transportModeText, transportMode === 'walking' && styles.transportModeTextActive]}>Piéton</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.transportModeButton, transportMode === 'cycling' && styles.transportModeActive]}
                  onPress={() => changeTransportMode('cycling')}
                >
                  <FontAwesome name="bicycle" size={20} color={transportMode === 'cycling' ? '#fff' : staticColors.text} />
                  <Text style={[styles.transportModeText, transportMode === 'cycling' && styles.transportModeTextActive]}>Vélo</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.transportModeButton, transportMode === 'driving' && styles.transportModeActive]}
                  onPress={() => changeTransportMode('driving')}
                >
                  <FontAwesome name="car" size={20} color={transportMode === 'driving' ? '#fff' : staticColors.text} />
                  <Text style={[styles.transportModeText, transportMode === 'driving' && styles.transportModeTextActive]}>Voiture</Text>
                </TouchableOpacity>
              </View>
              
              {/* Instruction actuelle */}
              {navigationSteps.length > 0 && navigationSteps[currentStepIndex] && (
                <View style={styles.currentStepContainer}>
                  <FontAwesome name="arrow-right" size={20} color={staticColors.primary} />
                  <Text style={styles.currentStepText} numberOfLines={2}>
                    {navigationSteps[currentStepIndex].instruction}
                  </Text>
                </View>
              )}
              
              <View style={styles.navigationInfoRow}>
                <View style={styles.navigationInfo}>
                  <Text style={styles.navigationDestination}>🎯 {routeInfo.productName}</Text>
                  <View style={styles.navigationStats}>
                    <View style={styles.navigationStat}>
                      <FontAwesome name="clock-o" size={16} color={staticColors.primary} />
                      <Text style={styles.navigationStatText}>{routeInfo.duration} min</Text>
                    </View>
                    <View style={styles.navigationStat}>
                      <FontAwesome name="road" size={16} color={staticColors.primary} />
                      <Text style={styles.navigationStatText}>{routeInfo.distance} km</Text>
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity style={styles.stopButton} onPress={stopNavigation}>
                  <FontAwesome name="times" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Bouton pour centrer sur la position */}
          <TouchableOpacity style={styles.centerButton} onPress={centerOnUserLocation}>
            <FontAwesome name="crosshairs" size={24} color={staticColors.primary} />
          </TouchableOpacity>

          {/* Bouton pour signaler un événement routier */}
          <TouchableOpacity 
            style={styles.reportEventButton} 
            onPress={() => setShowEventMenu(!showEventMenu)}
          >
            <FontAwesome name="exclamation-triangle" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Menu de signalement d'événement */}
          {showEventMenu && (
            <View style={styles.eventMenu}>
              <Text style={styles.eventMenuTitle}>Signaler un événement</Text>
              <TouchableOpacity style={styles.eventMenuItem} onPress={() => createRoadEvent('police')}>
                <View style={[styles.eventMenuIcon, { backgroundColor: '#3498db' }]}>
                  <FontAwesome name="shield" size={18} color="#fff" />
                </View>
                <Text style={styles.eventMenuText}>Police</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.eventMenuItem} onPress={() => createRoadEvent('accident')}>
                <View style={[styles.eventMenuIcon, { backgroundColor: '#e74c3c' }]}>
                  <FontAwesome name="car" size={18} color="#fff" />
                </View>
                <Text style={styles.eventMenuText}>Accident</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.eventMenuItem} onPress={() => createRoadEvent('traffic')}>
                <View style={[styles.eventMenuIcon, { backgroundColor: '#f39c12' }]}>
                  <FontAwesome name="road" size={18} color="#fff" />
                </View>
                <Text style={styles.eventMenuText}>Bouchon</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.eventMenuItem} onPress={() => createRoadEvent('hazard')}>
                <View style={[styles.eventMenuIcon, { backgroundColor: '#e67e22' }]}>
                  <FontAwesome name="exclamation-triangle" size={18} color="#fff" />
                </View>
                <Text style={styles.eventMenuText}>Danger</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.eventMenuItem} onPress={() => createRoadEvent('roadwork')}>
                <View style={[styles.eventMenuIcon, { backgroundColor: '#9b59b6' }]}>
                  <FontAwesome name="wrench" size={18} color="#fff" />
                </View>
                <Text style={styles.eventMenuText}>Travaux</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.eventMenuClose} onPress={() => setShowEventMenu(false)}>
                <Text style={styles.eventMenuCloseText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Badge du nombre de produits */}
          {!isNavigating && (
            <View style={styles.productsBadge}>
              <FontAwesome name="map-marker" size={16} color={staticColors.primary} />
              <Text style={styles.productsBadgeText}>{products.length} produits</Text>
            </View>
          )}
        </>
      )}
      {(!currentLocation && !loading) && (
        <View style={styles.noLocationContainer}>
          <FontAwesome name="map-marker" size={60} color="#ccc" />
          <Text style={styles.noLocationText}>Localisation non disponible</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeMap}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  // Styles pour la barre de recherche
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 15,
    right: 15,
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: staticColors.text,
    paddingVertical: 5,
  },
  searchLoader: {
    marginLeft: 10,
  },
  clearButton: {
    padding: 5,
    marginLeft: 5,
  },
  searchResultsContainer: {
    backgroundColor: staticColors.surface,
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.border,
  },
  resultIcon: {
    marginRight: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: staticColors.text,
  },
  resultSubtitle: {
    fontSize: 12,
    color: staticColors.textSecondary,
    marginTop: 2,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutContainer: {
    padding: 10,
    minWidth: 150,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  calloutCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  calloutPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: staticColors.success,
    marginBottom: 3,
  },
  calloutQuantity: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  calloutAddress: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  productsBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  productsBadgeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noLocationText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: staticColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  centerButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  reportEventButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#e74c3c',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  eventMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  eventCallout: {
    padding: 10,
    minWidth: 140,
  },
  eventCalloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  eventCalloutConfirm: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  eventActions: {
    flexDirection: 'row',
    gap: 10,
  },
  eventConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5,
  },
  eventDismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5,
  },
  eventActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  eventMenu: {
    position: 'absolute',
    bottom: 150,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  eventMenuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  eventMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  eventMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventMenuText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  eventMenuClose: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  eventMenuCloseText: {
    color: '#999',
    fontSize: 14,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: staticColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 10,
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  destinationMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  navigationPanel: {
    position: 'absolute',
    top: 70,
    left: 15,
    right: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  transportModes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  transportModeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: staticColors.background,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  transportModeActive: {
    backgroundColor: staticColors.primary,
    borderColor: staticColors.primary,
  },
  transportModeText: {
    fontSize: 10,
    marginTop: 4,
    color: staticColors.text,
    fontWeight: '500',
  },
  transportModeTextActive: {
    color: '#fff',
  },
  currentStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staticColors.primaryLight || '#e8f4f8',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 10,
  },
  currentStepText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: staticColors.text,
    lineHeight: 20,
  },
  navigationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  voiceButtonDisabled: {
    backgroundColor: staticColors.surface,
    borderColor: staticColors.textMuted,
  },
  navigationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navigationDestination: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  navigationStats: {
    flexDirection: 'row',
  },
  navigationStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  navigationStatText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: staticColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: staticColors.text,
    flex: 1,
  },
  previewCloseButton: {
    padding: 5,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: staticColors.background,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  previewStat: {
    alignItems: 'center',
    flex: 1,
  },
  previewStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: staticColors.text,
    marginTop: 5,
  },
  previewStatLabel: {
    fontSize: 12,
    color: staticColors.textSecondary,
    marginTop: 2,
  },
  previewStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: staticColors.border,
    marginHorizontal: 15,
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  previewCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: staticColors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  previewCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: staticColors.textSecondary,
  },
  previewGoButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: staticColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  previewGoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default MapComponent;

