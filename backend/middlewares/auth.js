// middlewares/auth.js - Middlewares d'authentification et d'autorisation
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Middleware pour protéger les routes (authentification requise)
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Récupérer le token depuis le header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token manquant.'
      });
    }

    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier si le compte est actif
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Compte désactivé. Contactez l\'administrateur.'
        });
      }

      // Ajouter l'utilisateur à la requête
      req.user = user;
      req.userId = user._id;

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token invalide'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expiré. Veuillez vous reconnecter.'
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Erreur middleware protect:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification'
    });
  }
};

/**
 * Middleware pour vérifier le rôle admin
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Privilèges administrateur requis.'
    });
  }

  next();
};

/**
 * Middleware pour vérifier que l'utilisateur est propriétaire de la ressource
 */
exports.isOwner = (resourceUserIdField = 'createdBy') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Les admins ont accès à tout
    if (req.user.role === 'admin') {
      return next();
    }

    // Vérifier la propriété de la ressource
    const resource = req.resource; // La ressource doit être ajoutée par le controller
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Ressource non trouvée'
      });
    }

    const resourceUserId = resource[resourceUserIdField];
    
    if (resourceUserId.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'êtes pas propriétaire de cette ressource.'
      });
    }

    next();
  };
};

/**
 * Middleware optionnel pour l'authentification (ne bloque pas si pas de token)
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
        }
      } catch (error) {
        // Ignorer les erreurs de token pour l'auth optionnelle
      }
    }

    next();
  } catch (error) {
    logger.error('Erreur middleware optionalAuth:', error);
    next();
  }
};

module.exports = exports;
