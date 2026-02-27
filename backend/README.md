# 🚀 LocProd Backend API

Backend professionnel Node.js + Express + MongoDB pour l'application LocProd avec OAuth, système anti-doublon et interface admin complète.

## 📋 Fonctionnalités

### 🔐 Authentification
- ✅ Inscription/Connexion classique avec JWT
- ✅ OAuth Google, Facebook, Twitter
- ✅ Gestion des rôles (user, admin)
- ✅ Protection des routes
- ✅ Désactivation de compte

### 📦 Produits
- ✅ CRUD complet
- ✅ **Système anti-doublon automatique** (name + category + location)
- ✅ Incrémentation/décrémentation de quantité
- ✅ Recherche par catégorie, texte, proximité GPS
- ✅ Géolocalisation avec MongoDB 2dsphere

### 👑 Interface Admin
- ✅ Gestion complète des utilisateurs
- ✅ Gestion complète des produits
- ✅ Statistiques détaillées
- ✅ Activation/Désactivation de comptes
- ✅ Suppression définitive

### 🛡️ Sécurité
- ✅ Helmet (headers sécurisés)
- ✅ Rate limiting
- ✅ Protection XSS
- ✅ Protection NoSQL injection
- ✅ Protection HPP
- ✅ CORS configuré
- ✅ Validation Joi
- ✅ Logging Winston

## 🛠️ Installation

### Prérequis
- Node.js >= 14.x
- MongoDB >= 5.0
- npm ou yarn

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configuration
Créer un fichier `.env` (copier depuis `.env.example`) :

```env
# Serveur
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/locprod

# JWT
JWT_SECRET=votre_cle_secrete_tres_longue_minimum_32_caracteres
JWT_EXPIRE=7d

# Session
SESSION_SECRET=votre_session_secret

# OAuth Google
GOOGLE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# OAuth Facebook
FACEBOOK_APP_ID=votre_app_id
FACEBOOK_APP_SECRET=votre_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# OAuth Twitter
TWITTER_CONSUMER_KEY=votre_consumer_key
TWITTER_CONSUMER_SECRET=votre_consumer_secret
TWITTER_CALLBACK_URL=http://localhost:5000/api/auth/twitter/callback

# Frontend
FRONTEND_URL=exp://192.168.1.100:19000
ALLOWED_ORIGINS=http://localhost:19006,exp://192.168.1.100:19000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Démarrer MongoDB
```bash
mongod
```

### 4. Démarrer le serveur
```bash
# Développement
npm run dev

# Production
npm start
```

Le serveur démarre sur `http://localhost:5000`

## 🐳 Docker

### Avec Docker Compose (recommandé)
```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### Build Docker manuel
```bash
docker build -t locprod-backend .
docker run -p 5000:5000 --env-file .env locprod-backend
```

## 📡 Endpoints API

### Authentification (`/api/auth`)
| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| POST | `/register` | Inscription | Public |
| POST | `/login` | Connexion | Public |
| GET | `/me` | Profil utilisateur | Private |
| POST | `/logout` | Déconnexion | Private |
| GET | `/google` | OAuth Google | Public |
| GET | `/google/callback` | Callback Google | Public |
| GET | `/facebook` | OAuth Facebook | Public |
| GET | `/facebook/callback` | Callback Facebook | Public |
| GET | `/twitter` | OAuth Twitter | Public |
| GET | `/twitter/callback` | Callback Twitter | Public |

### Produits (`/api/products`)
| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/` | Liste des produits | Public |
| GET | `/:id` | Détails d'un produit | Public |
| POST | `/` | Créer un produit (anti-doublon) | Private |
| PUT | `/:id` | Modifier un produit | Private |
| DELETE | `/:id` | Supprimer un produit | Private |

**Paramètres de recherche** :
- `?category=1` - Filtrer par catégorie
- `?search=terme` - Recherche textuelle
- `?latitude=48.8566&longitude=2.3522&maxDistance=5000` - Recherche par proximité
- `?status=disponible` - Filtrer par statut

### Utilisateurs (`/api/users`)
| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/profile` | Mon profil | Private |
| PUT | `/profile` | Modifier mon profil | Private |
| GET | `/:id/products` | Produits d'un utilisateur | Public |

### Admin (`/api/admin`)
| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/users` | Liste des utilisateurs | Admin |
| GET | `/users/:id` | Détails utilisateur | Admin |
| PUT | `/users/:id` | Modifier utilisateur | Admin |
| DELETE | `/users/:id` | Supprimer utilisateur | Admin |
| PATCH | `/users/:id/toggle-status` | Activer/Désactiver compte | Admin |
| GET | `/products` | Liste des produits | Admin |
| GET | `/products/:id` | Détails produit | Admin |
| POST | `/products` | Créer produit | Admin |
| PUT | `/products/:id` | Modifier produit | Admin |
| DELETE | `/products/:id` | Supprimer produit | Admin |
| GET | `/stats` | Statistiques | Admin |

## 🔄 Système Anti-Doublon

Lorsqu'un utilisateur ajoute un produit, le système vérifie automatiquement si un produit similaire existe déjà (même nom + catégorie + localisation).

**Si le produit existe** :
- La quantité est incrémentée de 1
- L'utilisateur est ajouté aux contributeurs
- Retourne `isNew: false`

**Si le produit n'existe pas** :
- Un nouveau produit est créé avec `quantity: 1`
- Retourne `isNew: true`

**Exemple** :
```json
POST /api/products
{
  "name": "Pommes Bio",
  "category": { "id": 1, "name": "Alimentaire", ... },
  "location": {
    "coordinates": [2.3522, 48.8566],
    "address": "Paris 75001"
  }
}

// Réponse si doublon détecté
{
  "success": true,
  "message": "Ce produit existe déjà. Quantité augmentée de 1.",
  "product": { ...product, "quantity": 3 },
  "isNew": false
}
```

## 👑 Créer un Admin

Par défaut, tous les utilisateurs ont le rôle `user`. Pour créer un admin :

### Option 1 : Directement dans MongoDB
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### Option 2 : Via l'API (si vous êtes déjà admin)
```bash
PUT /api/admin/users/:userId
{
  "role": "admin"
}
```

### Option 3 : Créer le premier admin manuellement
```javascript
// Dans MongoDB Compass ou shell
db.users.insertOne({
  name: "Admin",
  email: "admin@locprod.com",
  password: "$2a$10$hashedpassword", // Hash bcrypt
  role: "admin",
  provider: "local",
  isActive: true,
  createdAt: new Date()
})
```

## 🔑 Configuration OAuth

### Google OAuth
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un projet
3. Activer Google+ API
4. Créer des identifiants OAuth 2.0
5. Ajouter les URIs de redirection :
   - `http://localhost:5000/api/auth/google/callback`
6. Copier Client ID et Client Secret dans `.env`

### Facebook OAuth
1. Aller sur [Facebook Developers](https://developers.facebook.com/)
2. Créer une application
3. Ajouter "Facebook Login"
4. Configurer les URIs de redirection valides
5. Copier App ID et App Secret dans `.env`

### Twitter OAuth
1. Aller sur [Twitter Developer Portal](https://developer.twitter.com/)
2. Créer une application
3. Activer "Request email from users"
4. Configurer le Callback URL
5. Copier API Key et API Secret dans `.env`

## 📊 Structure du Projet

```
backend/
├── config/
│   ├── database.js          # Configuration MongoDB
│   ├── logger.js            # Configuration Winston
│   └── passport.js          # Configuration OAuth
├── controllers/
│   ├── authController.js    # Authentification
│   ├── productController.js # Produits
│   ├── userController.js    # Utilisateurs
│   └── adminController.js   # Admin
├── middlewares/
│   ├── auth.js              # Auth & autorisation
│   ├── security.js          # Sécurité
│   └── validation.js        # Validation Joi
├── models/
│   ├── User.js              # Modèle utilisateur
│   └── Product.js           # Modèle produit
├── routes/
│   ├── auth.js              # Routes auth
│   ├── products.js          # Routes produits
│   ├── users.js             # Routes users
│   └── admin.js             # Routes admin
├── logs/                    # Logs Winston
├── .env.example             # Template variables
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.js                # Point d'entrée
└── README.md
```

## 🧪 Tests

### Tester l'API avec curl

**Inscription** :
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

**Connexion** :
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Créer un produit** :
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Produit Test",
    "category": {"id": 1, "name": "Alimentaire", "icon": "shopping-cart", "iconFamily": "FontAwesome", "color": "#FF6B6B"},
    "location": {"coordinates": [2.3522, 48.8566], "address": "Paris"}
  }'
```

## 📝 Logs

Les logs sont enregistrés dans le dossier `logs/` :
- `error.log` - Erreurs uniquement
- `combined.log` - Tous les logs

## 🔒 Sécurité

- **Helmet** : Headers HTTP sécurisés
- **Rate Limiting** : 100 requêtes/15min par IP
- **Auth Rate Limiting** : 5 tentatives/15min pour login/register
- **NoSQL Injection** : Sanitization avec express-mongo-sanitize
- **XSS** : Protection avec xss-clean
- **HPP** : Protection contre la pollution des paramètres
- **JWT** : Tokens sécurisés avec expiration
- **Bcrypt** : Hash des mots de passe (10 rounds)

## 🚀 Déploiement

### Heroku
```bash
heroku create locprod-api
heroku addons:create mongolab
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

### VPS (Ubuntu)
```bash
# Installer Node.js et MongoDB
# Cloner le repo
git clone https://github.com/your-repo/locprod-backend.git
cd locprod-backend
npm install
# Configurer .env
# Utiliser PM2 pour la production
npm install -g pm2
pm2 start server.js --name locprod-api
pm2 save
pm2 startup
```

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.

## 📄 Licence

ISC

---

**LocProd Backend API v2.0** - Développé avec ❤️
