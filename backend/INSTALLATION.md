# 📦 Guide d'Installation Complet - LocProd Backend

## 🎯 Installation Rapide (5 minutes)

### 1. Prérequis
```bash
# Vérifier Node.js (>= 14.x)
node --version

# Vérifier npm
npm --version

# Vérifier MongoDB (>= 5.0)
mongod --version
```

### 2. Installation
```bash
cd backend
npm install
```

### 3. Configuration
```bash
# Copier le template
cp .env.example .env

# Éditer .env avec vos valeurs
nano .env
```

**Configuration minimale** :
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/locprod
JWT_SECRET=generer_une_cle_aleatoire_tres_longue_32_caracteres_minimum
SESSION_SECRET=generer_une_autre_cle_aleatoire
FRONTEND_URL=exp://192.168.1.100:19000
ALLOWED_ORIGINS=*
```

### 4. Démarrer MongoDB
```bash
# Mac (avec Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB

# Ou manuellement
mongod
```

### 5. Démarrer le serveur
```bash
npm run dev
```

✅ Le serveur est prêt sur `http://localhost:5000`

---

## 🔧 Installation Détaillée

### Étape 1 : Installer MongoDB

#### Mac (Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

#### Ubuntu/Debian
```bash
# Importer la clé publique
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Ajouter le dépôt
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Installer
sudo apt-get update
sudo apt-get install -y mongodb-org

# Démarrer
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Windows
1. Télécharger depuis [mongodb.com](https://www.mongodb.com/try/download/community)
2. Installer avec l'assistant
3. MongoDB Compass est inclus (interface graphique)

#### Docker (Alternative)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### Étape 2 : Installer Node.js

#### Mac (Homebrew)
```bash
brew install node@18
```

#### Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Windows
Télécharger depuis [nodejs.org](https://nodejs.org/)

### Étape 3 : Cloner et Installer

```bash
# Si vous avez Git
git clone https://github.com/your-repo/locprod.git
cd locprod/backend

# Ou extraire le ZIP et naviguer vers backend/
cd backend

# Installer les dépendances
npm install
```

### Étape 4 : Configuration Avancée

#### Générer des secrets sécurisés
```bash
# Générer JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Générer SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Configuration OAuth

**Google OAuth** :
1. Aller sur [console.cloud.google.com](https://console.cloud.google.com/)
2. Créer un projet "LocProd"
3. Activer "Google+ API"
4. Identifiants → Créer des identifiants → ID client OAuth 2.0
5. Type d'application : Application Web
6. URIs de redirection autorisés :
   - `http://localhost:5000/api/auth/google/callback`
   - `https://votre-domaine.com/api/auth/google/callback` (production)
7. Copier Client ID et Client Secret dans `.env`

**Facebook OAuth** :
1. Aller sur [developers.facebook.com](https://developers.facebook.com/)
2. Mes Apps → Créer une app
3. Type : Consommateur
4. Ajouter un produit → Facebook Login
5. Paramètres → De base :
   - Copier ID de l'app et Clé secrète
6. Facebook Login → Paramètres :
   - URI de redirection OAuth valides : `http://localhost:5000/api/auth/facebook/callback`
7. Copier dans `.env`

**Twitter OAuth** :
1. Aller sur [developer.twitter.com](https://developer.twitter.com/)
2. Projects & Apps → Create App
3. User authentication settings :
   - Type : Web App
   - Callback URL : `http://localhost:5000/api/auth/twitter/callback`
   - Request email from users : ✅
4. Keys and tokens :
   - Copier API Key et API Key Secret
5. Copier dans `.env`

#### Fichier .env complet
```env
# Serveur
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/locprod
# Ou MongoDB Atlas :
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/locprod?retryWrites=true&w=majority

# JWT
JWT_SECRET=votre_jwt_secret_genere_64_caracteres
JWT_EXPIRE=7d

# Session
SESSION_SECRET=votre_session_secret_genere_64_caracteres

# OAuth Google
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# OAuth Facebook
FACEBOOK_APP_ID=123456789012345
FACEBOOK_APP_SECRET=abcdef1234567890abcdef1234567890
FACEBOOK_CALLBACK_URL=http://localhost:5000/api/auth/facebook/callback

# OAuth Twitter
TWITTER_CONSUMER_KEY=abcdefghijklmnopqrstuvwx
TWITTER_CONSUMER_SECRET=abcdefghijklmnopqrstuvwxyz1234567890abcdefghij
TWITTER_CALLBACK_URL=http://localhost:5000/api/auth/twitter/callback

# Frontend
FRONTEND_URL=exp://192.168.1.100:19000
ALLOWED_ORIGINS=http://localhost:19006,exp://192.168.1.100:19000,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Étape 5 : Créer le Premier Admin

#### Option 1 : Via MongoDB Shell
```bash
mongosh

use locprod

db.users.insertOne({
  name: "Admin",
  email: "admin@locprod.com",
  password: "$2a$10$YourHashedPasswordHere",
  role: "admin",
  provider: "local",
  isActive: true,
  createdAt: new Date()
})
```

#### Option 2 : Via l'API
```bash
# 1. S'inscrire normalement
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@locprod.com","password":"admin123"}'

# 2. Dans MongoDB, changer le rôle
mongosh
use locprod
db.users.updateOne(
  { email: "admin@locprod.com" },
  { $set: { role: "admin" } }
)
```

#### Option 3 : Script Node.js
Créer `create-admin.js` :
```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI);

async function createAdmin() {
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@locprod.com',
    password: 'admin123',
    role: 'admin',
    provider: 'local'
  });
  console.log('Admin créé:', admin.email);
  process.exit(0);
}

createAdmin();
```

Exécuter :
```bash
node create-admin.js
```

---

## 🐳 Installation avec Docker

### Option 1 : Docker Compose (Recommandé)

```bash
# Créer .env
cp .env.example .env

# Éditer .env avec vos secrets
nano .env

# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f backend

# Arrêter
docker-compose down
```

### Option 2 : Docker Manuel

```bash
# Build l'image
docker build -t locprod-backend .

# Démarrer MongoDB
docker run -d --name mongodb -p 27017:27017 mongo:7.0

# Démarrer le backend
docker run -d \
  --name locprod-backend \
  -p 5000:5000 \
  --link mongodb:mongodb \
  --env-file .env \
  locprod-backend
```

---

## 🧪 Vérification de l'Installation

### 1. Tester la connexion
```bash
curl http://localhost:5000
```

Réponse attendue :
```json
{
  "success": true,
  "message": "Bienvenue sur l'API LocProd",
  "version": "2.0.0"
}
```

### 2. Tester l'inscription
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Tester la connexion
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Tester avec le token
```bash
# Remplacer YOUR_TOKEN par le token reçu
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Résolution des Problèmes

### MongoDB ne démarre pas
```bash
# Vérifier le statut
sudo systemctl status mongod

# Voir les logs
sudo journalctl -u mongod

# Vérifier le port
sudo lsof -i :27017

# Redémarrer
sudo systemctl restart mongod
```

### Port 5000 déjà utilisé
```bash
# Trouver le processus
lsof -i :5000

# Tuer le processus
kill -9 PID

# Ou changer le port dans .env
PORT=5001
```

### Erreur "Cannot find module"
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur OAuth
- Vérifier que les URLs de callback sont exactement les mêmes
- Vérifier que les credentials sont corrects dans `.env`
- Vérifier que l'app OAuth est en mode "Production" (pas "Development")

### Erreur de connexion MongoDB
```bash
# Vérifier que MongoDB est démarré
mongosh

# Tester la connexion
mongosh mongodb://localhost:27017/locprod

# Vérifier l'URI dans .env
echo $MONGODB_URI
```

---

## 📊 Monitoring

### Logs en temps réel
```bash
# Logs du serveur
npm run dev

# Logs MongoDB
tail -f /var/log/mongodb/mongod.log

# Logs avec PM2 (production)
pm2 logs locprod-api
```

### Vérifier la santé
```bash
curl http://localhost:5000/health
```

---

## 🚀 Passer en Production

### 1. Variables d'environnement
```env
NODE_ENV=production
BASE_URL=https://api.votre-domaine.com
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://votre-app.com
ALLOWED_ORIGINS=https://votre-app.com
```

### 2. Utiliser PM2
```bash
npm install -g pm2
pm2 start server.js --name locprod-api
pm2 save
pm2 startup
```

### 3. Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name api.votre-domaine.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. SSL avec Certbot
```bash
sudo certbot --nginx -d api.votre-domaine.com
```

---

## ✅ Checklist Finale

- [ ] MongoDB installé et démarré
- [ ] Node.js >= 14.x installé
- [ ] Dépendances npm installées
- [ ] Fichier `.env` configuré
- [ ] Secrets JWT et Session générés
- [ ] OAuth configuré (optionnel)
- [ ] Premier admin créé
- [ ] Tests API passent
- [ ] Logs fonctionnent
- [ ] Backend accessible depuis le frontend

**Félicitations ! Votre backend LocProd est prêt ! 🎉**
