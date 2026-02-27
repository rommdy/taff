// services/api.js - Service API pour communiquer avec le backend
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration de base de l'API
// Pour tester sur un appareil physique, utilisez l'IP de votre ordinateur
const API_URL = __DEV__ 
  ? 'http://10.142.184.102:5001/api'  // Développement - IP locale pour appareil physique
  : 'https://locprod-api.onrender.com/api'; // Production - Render

console.log('🌐 API URL:', API_URL);

// Créer une instance axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  async (config) => {
    try {
      // Essayer de récupérer le token depuis SecureStore
      let token = await SecureStore.getItemAsync('userToken');
      
      // Si pas trouvé, essayer AsyncStorage (fallback)
      if (!token) {
        token = await AsyncStorage.getItem('userToken');
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide, déconnecter l'utilisateur
      await SecureStore.deleteItemAsync('userToken');
      await AsyncStorage.removeItem('userToken');
      // Vous pouvez également rediriger vers l'écran de connexion ici
    }
    
    return Promise.reject(error);
  }
);

// ===== AUTHENTIFICATION =====

export const authAPI = {
  // Inscription
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      await saveToken(response.data.token);
    }
    return response.data;
  },

  // Connexion
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      await saveToken(response.data.token);
    }
    return response.data;
  },

  // Déconnexion
  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    await AsyncStorage.removeItem('userToken');
  },

  // Obtenir le profil de l'utilisateur connecté
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ===== PRODUITS =====

export const productsAPI = {
  // Obtenir tous les produits
  getAll: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  // Obtenir un produit par ID
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Créer un produit
  create: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  // Mettre à jour un produit
  update: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  // Supprimer un produit
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  // Supprimer un produit (Admin avec clé)
  adminDelete: async (id) => {
    const response = await api.delete(`/products/admin/${id}`, {
      headers: {
        'x-admin-key': 'LocPr0d@Adm1n#2026!Sec'
      }
    });
    return response.data;
  },

  // Rechercher des produits à proximité
  searchNearby: async (latitude, longitude, maxDistance = 5000) => {
    const response = await api.get('/products', {
      params: { latitude, longitude, maxDistance }
    });
    return response.data;
  },

  // Rechercher des produits par catégorie
  searchByCategory: async (categoryId) => {
    const response = await api.get('/products', {
      params: { category: categoryId }
    });
    return response.data;
  },

  // Recherche textuelle
  search: async (searchTerm) => {
    const response = await api.get('/products', {
      params: { search: searchTerm }
    });
    return response.data;
  },

  // Rechercher des produits similaires (anti-doublon)
  searchSimilar: async (name, categoryId) => {
    const response = await api.get('/products/search-similar', {
      params: { name, categoryId }
    });
    return response.data;
  },

  // Vérifier si un produit existe déjà à un lieu donné
  checkDuplicate: async (name, categoryId, address) => {
    const response = await api.get('/products/check-duplicate', {
      params: { name, categoryId, address }
    });
    return response.data;
  },

  // Ajouter un lieu à un produit existant
  addLocation: async (productId, locationData) => {
    const response = await api.post(`/products/${productId}/locations`, locationData);
    return response.data;
  },
};

// ===== UTILISATEURS =====

export const usersAPI = {
  // Obtenir le profil
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Mettre à jour le profil
  updateProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },

  // Supprimer le compte
  deleteAccount: async () => {
    const response = await api.delete('/users/account');
    return response.data;
  },

  // Obtenir les produits d'un utilisateur
  getUserProducts: async (userId) => {
    const response = await api.get(`/users/${userId}/products`);
    return response.data;
  },
};

// ===== HELPERS =====

// Sauvegarder le token
const saveToken = async (token) => {
  try {
    await SecureStore.setItemAsync('userToken', token);
    await AsyncStorage.setItem('userToken', token); // Backup
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du token:', error);
  }
};

// Obtenir le token
export const getToken = async () => {
  try {
    let token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      token = await AsyncStorage.getItem('userToken');
    }
    return token;
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

// ===== SIGNALEMENTS =====

export const reportsAPI = {
  // Créer un signalement
  create: async (productId, reason, description = '') => {
    const response = await api.post('/reports', {
      productId,
      reason,
      description
    });
    return response.data;
  },

  // Obtenir tous les signalements (Admin)
  getAll: async (status = null, page = 1) => {
    const params = { page };
    if (status) params.status = status;
    
    const response = await api.get('/reports/admin/all', {
      params,
      headers: {
        'x-admin-key': 'LocPr0d@Adm1n#2026!Sec'
      }
    });
    return response.data;
  },

  // Obtenir les statistiques (Admin)
  getStats: async () => {
    const response = await api.get('/reports/admin/stats', {
      headers: {
        'x-admin-key': 'LocPr0d@Adm1n#2026!Sec'
      }
    });
    return response.data;
  },

  // Mettre à jour le statut d'un signalement (Admin)
  updateStatus: async (reportId, status, adminNotes = '') => {
    const response = await api.put(`/reports/admin/${reportId}`, {
      status,
      adminNotes
    }, {
      headers: {
        'x-admin-key': 'LocPr0d@Adm1n#2026!Sec'
      }
    });
    return response.data;
  },

  // Supprimer un signalement (Admin)
  delete: async (reportId) => {
    const response = await api.delete(`/reports/admin/${reportId}`, {
      headers: {
        'x-admin-key': 'LocPr0d@Adm1n#2026!Sec'
      }
    });
    return response.data;
  }
};

// API pour les événements routiers (police, accident, bouchon)
export const roadEventsAPI = {
  // Obtenir les événements à proximité
  getNearby: async (latitude, longitude, maxDistance = 10000) => {
    const response = await api.get('/road-events/nearby', {
      params: { latitude, longitude, maxDistance }
    });
    return response.data;
  },

  // Créer un nouvel événement
  create: async (type, longitude, latitude, address = '', description = '') => {
    const response = await api.post('/road-events', {
      type,
      longitude,
      latitude,
      address,
      description
    });
    return response.data;
  },

  // Confirmer un événement (il est toujours là)
  confirm: async (eventId) => {
    const response = await api.post(`/road-events/${eventId}/confirm`);
    return response.data;
  },

  // Signaler qu'un événement n'est plus là
  dismiss: async (eventId) => {
    const response = await api.post(`/road-events/${eventId}/dismiss`);
    return response.data;
  },

  // Supprimer un événement
  delete: async (eventId) => {
    const response = await api.delete(`/road-events/${eventId}`);
    return response.data;
  }
};

export default api;
