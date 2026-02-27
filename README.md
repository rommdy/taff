# 🌍 LocProd - Application de Localisation de Produits

Application mobile React Native (Expo) + Backend Node.js professionnel pour localiser et partager des produits locaux avec système anti-doublon intelligent.

## 📚 Documentation Rapide

- **[🚀 DEMARRAGE_RAPIDE.md](DEMARRAGE_RAPIDE.md)** - Lancer l'app en 3 minutes
- **[🛡️ ADMIN_LOGIN.md](ADMIN_LOGIN.md)** - Connexion et panneau administrateur
- **[👤 MODE_INVITE.md](MODE_INVITE.md)** - Mode invité sans compte
- **[✅ ECRANS_CONNECTES.md](ECRANS_CONNECTES.md)** - Tous les écrans connectés à l'API
- **[🧪 TESTS_RAPIDES.md](TESTS_RAPIDES.md)** - Guide de test complet (20 min)
- **[🔗 CONNEXION_API.md](CONNEXION_API.md)** - Comment le frontend communique avec le backend
- **[📊 RESUME_COMPLET.md](RESUME_COMPLET.md)** - Vue d'ensemble complète du projet
- **[🎨 GUIDE_VISUEL.md](GUIDE_VISUEL.md)** - Schémas et flux de l'application
- **[🏗️ BACKEND_COMPLET.md](BACKEND_COMPLET.md)** - Documentation backend détaillée

## ✨ Nouveautés

- ✅ **Backend API complet** avec Node.js + Express + MongoDB
- ✅ **Authentification OAuth** (Google, Facebook, Twitter)
- ✅ **Login administrateur** - Panneau admin dédié avec vérification des droits
- ✅ **Mode invité** - Découvrir l'app sans créer de compte
- ✅ **Système anti-doublon automatique** pour les produits
- ✅ **Interface admin complète** avec statistiques et gestion
- ✅ **Sécurité niveau production** (Helmet, Rate limiting, XSS, etc.)
- ✅ **Frontend connecté à l'API** (Tous les écrans fonctionnels)
- ✅ **Docker ready** pour déploiement facile

## 🎯 Fonctionnalités

- ✅ **Authentification JWT** - Inscription et connexion sécurisées
- 🗺️ **Carte Interactive** - Visualisation des produits sur une carte avec markers personnalisés
- 🔍 **Recherche Avancée** - Par nom, catégorie, ou proximité géographique
- 📦 **Gestion de Produits** - Ajout, modification, suppression de produits
- 🎨 **Icônes Vectorielles** - 23 catégories avec icônes FontAwesome
- 📍 **Géolocalisation** - Détection automatique de la position
- 👤 **Profil Utilisateur** - Gestion du profil et des produits

## 🛠️ Tech Stack

### Frontend (React Native)
- **Framework**: React Native avec Expo
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **Icônes**: React Native Vector Icons (FontAwesome)
- **Carte**: React Native Maps
- **Géolocalisation**: Expo Location
- **HTTP Client**: Axios
- **Stockage**: Expo SecureStore + AsyncStorage

### Backend (Node.js)
- **Framework**: Express.js
- **Base de données**: MongoDB avec Mongoose
- **Authentification**: JWT (jsonwebtoken)
- **Sécurité**: bcryptjs pour le hashage des mots de passe
- **Validation**: express-validator

## 📋 Prérequis

- Node.js >= 14.x
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- MongoDB (local ou Atlas)
- Un smartphone avec l'app Expo Go OU un émulateur

## 🚀 Installation

### 1. Cloner le projet
```bash
cd locprod
```

### 2. Installer les dépendances Frontend
```bash
npm install
```

### 3. Installer les dépendances Backend
```bash
cd backend
npm install
```

### 4. Configuration Backend

Créer un fichier `.env` dans le dossier `backend/` :

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/locprod
JWT_SECRET=votre_cle_secrete_tres_longue_et_aleatoire
JWT_EXPIRE=7d
ALLOWED_ORIGINS=http://localhost:19006,exp://192.168.1.100:19000
```

### 5. Démarrer MongoDB

```bash
# Si MongoDB est installé localement
mongod

# Ou utilisez MongoDB Atlas (cloud)
```

### 6. Démarrer le Backend

```bash
cd backend
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

### 7. Configurer l'API Frontend

Modifier `src/services/api.js` ligne 7 avec votre IP locale :

```javascript
const API_URL = __DEV__ 
  ? 'http://VOTRE_IP_LOCALE:5000/api'  // Ex: http://192.168.1.100:5000/api
  : 'https://votre-api-production.com/api';
```

### 8. Démarrer l'application React Native

```bash
# Retour à la racine du projet
cd ..
npm start
```

Scannez le QR code avec Expo Go (Android) ou la caméra (iOS)

## 📁 Structure du Projet

```
locprod/
├── backend/                    # Backend Node.js/Express
│   ├── models/                # Modèles Mongoose
│   │   ├── User.js
│   │   └── Product.js
│   ├── routes/                # Routes API
│   │   ├── auth.js
│   │   ├── products.js
│   │   └── users.js
│   ├── middleware/            # Middlewares
│   │   └── auth.js
│   ├── server.js              # Point d'entrée
│   ├── package.json
│   └── .env.example
│
├── src/
│   ├── components/            # Composants React Native
│   │   ├── common/           # Composants réutilisables
│   │   │   ├── CustomInput.js
│   │   │   ├── CustomButton.js
│   │   │   └── IconCard.js
│   │   ├── CatalogueScreen.js
│   │   ├── MapScreen.js
│   │   ├── Carte.js
│   │   ├── ProfileScreen.js
│   │   ├── AjouterProduitScreen.js
│   │   └── Navigation.js
│   └── services/              # Services API
│       └── api.js
│
├── config/                    # Configuration
│   ├── theme.js              # Thème et couleurs
│   └── categories.js         # Catégories avec icônes
│
├── assets/                    # Images et ressources
├── App.js                     # Point d'entrée
├── package.json
├── babel.config.js
└── README.md
```

## 🎨 Catégories Disponibles

23 catégories avec icônes vectorielles :
- 🛒 Alimentaire
- 🍽️ Restaurant
- 🍷 Alcool
- 💻 Informatique
- 🎧 Image/Son
- 🔌 Électroménager
- 🚲 Vélo/Trottinette
- 🎵 Musique
- 📚 Livres
- 👕 Vêtements
- 👟 Chaussures
- 💄 Maquillage/Soins
- 💊 Parapharmacie
- 🐾 Animaux
- 🧼 Produit Ménager
- 🎮 Jouets
- 🚗 Auto/Moto
- 🏠 Décoration
- 🔧 Bricolage
- 🌱 Jardin
- 🌸 Fleurs
- 🚬 Tabac
- ✏️ Papeterie

## 📡 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur (protégé)

### Produits
- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détails d'un produit
- `POST /api/products` - Créer un produit (protégé)
- `PUT /api/products/:id` - Modifier un produit (protégé)
- `DELETE /api/products/:id` - Supprimer un produit (protégé)

### Utilisateurs
- `GET /api/users/profile` - Profil (protégé)
- `PUT /api/users/profile` - Modifier le profil (protégé)
- `GET /api/users/:id/products` - Produits d'un utilisateur

## 🎨 Personnalisation du Thème

Modifier `config/theme.js` pour changer les couleurs :

```javascript
export const theme = {
  colors: {
    primary: '#007AFF',      // Couleur principale
    secondary: '#5856D6',    // Couleur secondaire
    success: '#34C759',      // Succès
    danger: '#FF3B30',       // Erreur
    // ...
  }
};
```

## 🐛 Résolution des Problèmes

### Erreur "Unable to resolve module"
```bash
npm install
expo start -c  # Clear cache
```

### Erreur de connexion API
- Vérifiez que le backend est démarré
- Utilisez votre IP locale (pas localhost) dans `api.js`
- Vérifiez que votre téléphone et ordinateur sont sur le même réseau

### Erreur MongoDB
```bash
# Vérifier que MongoDB est démarré
mongod --version
```

### Erreur de permissions (localisation)
- Acceptez les permissions sur votre appareil
- Vérifiez `app.json` pour les permissions

## 📱 Build Production

### Android
```bash
expo build:android
```

### iOS
```bash
expo build:ios
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou un pull request.

## 📄 Licence

ISC

## 👨‍💻 Auteur

Fréquence 2 Web - © 2023

## 📞 Support

Pour toute question ou problème, contactez-nous.

---

**Note**: Cette application utilise uniquement des icônes vectorielles (pas d'images) pour une meilleure performance et une taille d'application réduite.
