// server.js - Point d'entrée du serveur Express professionnel
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const compression = require('compression');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/database');
const logger = require('./config/logger');

// Middlewares de sécurité
const {
  limiter,
  sanitize,
  xssProtection,
  hppProtection,
  securityHeaders
} = require('./middlewares/security');

// Charger les variables d'environnement
dotenv.config();

// Initialiser l'application Express
const app = express();

// ===== SÉCURITÉ =====
app.use(securityHeaders); // Headers de sécurité avec Helmet
app.use(limiter); // Rate limiting global
app.use(sanitize); // Protection contre les injections NoSQL
app.use(xssProtection); // Protection XSS
app.use(hppProtection); // Protection contre la pollution des paramètres

// ===== MIDDLEWARE GÉNÉRAL =====
app.use(compression()); // Compression des réponses

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging HTTP
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// ===== SESSION & PASSPORT =====
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// ===== ROUTES =====

// Route de test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API LocProd',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      users: '/api/users',
      admin: '/api/admin',
      docs: '/api-docs'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/road-events', require('./routes/roadEvents'));

// ===== GESTION DES ERREURS =====

// 404 - Route non trouvée
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  logger.error('Erreur serveur:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===== DÉMARRAGE DU SERVEUR =====

const PORT = process.env.PORT || 5000;

// Connexion à la base de données puis démarrage du serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`🚀 Serveur démarré sur le port ${PORT}`);
    logger.info(`📝 Environnement: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🌐 URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
  });
}).catch((error) => {
  logger.error('❌ Impossible de démarrer le serveur:', error);
  process.exit(1);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu. Arrêt gracieux du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT reçu. Arrêt gracieux du serveur...');
  process.exit(0);
});

module.exports = app;
