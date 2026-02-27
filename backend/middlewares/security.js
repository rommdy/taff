// middlewares/security.js - Middlewares de sécurité
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const helmet = require('helmet');

/**
 * Rate limiting pour prévenir les attaques par force brute
 */
exports.limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500,
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiting strict pour les routes d'authentification
 */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
  }
});

/**
 * Sanitization contre les injections NoSQL
 */
exports.sanitize = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Tentative d'injection NoSQL détectée: ${key}`);
  },
});

/**
 * Protection contre les attaques XSS
 */
exports.xssProtection = xss();

/**
 * Protection contre la pollution des paramètres HTTP
 */
exports.hppProtection = hpp({
  whitelist: ['category', 'status', 'sort'] // Paramètres autorisés en double
});

/**
 * Headers de sécurité avec Helmet
 */
exports.securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

module.exports = exports;
