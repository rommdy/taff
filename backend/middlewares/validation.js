// middlewares/validation.js - Validation avec Joi
const Joi = require('joi');

/**
 * Middleware de validation générique
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      console.log('❌ Validation error:', JSON.stringify(errors, null, 2));
      console.log('📦 Request body:', JSON.stringify(req.body, null, 2));

      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors
      });
    }

    req.validatedBody = value;
    next();
  };
};

/**
 * Schémas de validation
 */

// Inscription
exports.registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required()
    .messages({
      'string.empty': 'Le nom est requis',
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 50 caractères'
    }),
  email: Joi.string().email().lowercase().required()
    .messages({
      'string.email': 'Email invalide',
      'string.empty': 'L\'email est requis'
    }),
  password: Joi.string().min(6).max(100).required()
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
      'string.empty': 'Le mot de passe est requis'
    }),
  telephone: Joi.string().trim().allow('', null),
  adresse: Joi.string().trim().allow('', null)
});

// Connexion
exports.loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Email invalide',
      'string.empty': 'L\'email est requis'
    }),
  password: Joi.string().required()
    .messages({
      'string.empty': 'Le mot de passe est requis'
    })
});

// Création de produit
exports.createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.empty': 'Le nom du produit est requis',
      'string.min': 'Le nom doit contenir au moins 2 caractères'
    }),
  description: Joi.string().trim().max(1000).allow('', null),
  prix: Joi.alternatives().try(Joi.string(), Joi.number()).allow('', null),
  category: Joi.object({
    id: Joi.number().required(),
    name: Joi.string().required(),
    icon: Joi.string().required(),
    iconFamily: Joi.string().required(),
    color: Joi.string().required()
  }).required()
    .messages({
      'object.base': 'La catégorie est requise'
    }),
  location: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required()
      .messages({
        'array.length': 'Les coordonnées doivent contenir longitude et latitude'
      }),
    address: Joi.string().trim().allow('', null)
  }).allow(null).optional(),
  images: Joi.array().items(Joi.string()).optional()
});

// Mise à jour de produit
exports.updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(1000).allow('', null),
  prix: Joi.string().trim().allow('', null),
  category: Joi.object({
    id: Joi.number(),
    name: Joi.string(),
    icon: Joi.string(),
    iconFamily: Joi.string(),
    color: Joi.string()
  }),
  status: Joi.string().valid('disponible', 'vendu', 'reserve'),
  quantity: Joi.number().min(0)
});

// Mise à jour du profil utilisateur
exports.updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  firstName: Joi.string().trim().max(50).allow('', null),
  username: Joi.string().trim().min(3).max(30).allow('', null),
  email: Joi.string().email().lowercase(),
  telephone: Joi.string().trim().allow('', null),
  adresse: Joi.string().trim().allow('', null),
  avatar: Joi.string().allow('', null),
  bio: Joi.string().trim().max(500).allow('', null),
  password: Joi.string().min(6).max(100),
  settings: Joi.object({
    twoFactorEnabled: Joi.boolean(),
    emailNotifications: Joi.boolean(),
    pushNotifications: Joi.boolean(),
    smsNotifications: Joi.boolean(),
    profilePublic: Joi.boolean(),
    showOnlineStatus: Joi.boolean()
  })
});

// Mise à jour utilisateur par admin
exports.updateUserByAdminSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  email: Joi.string().email().lowercase(),
  role: Joi.string().valid('user', 'admin'),
  isActive: Joi.boolean(),
  telephone: Joi.string().trim().allow('', null),
  adresse: Joi.string().trim().allow('', null)
});

/**
 * Export du middleware de validation
 */
exports.validate = validate;

module.exports = exports;
