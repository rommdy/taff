// routes/auth.js - Routes d'authentification avec OAuth
const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/security');
const { validate, registerSchema, loginSchema } = require('../middlewares/validation');

// ===== ROUTES CLASSIQUES =====

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', 
  authLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Obtenir les informations de l'utilisateur connecté
 * @access  Private
 */
router.get('/me', protect, authController.getMe);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion
 * @access  Private
 */
router.post('/logout', protect, authController.logout);

// ===== ROUTES OAUTH =====

/**
 * @route   GET /api/auth/google
 * @desc    Authentification Google
 * @access  Public
 */
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Callback Google OAuth
 * @access  Public
 */
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/api/auth/error',
    session: false 
  }),
  authController.oauthCallback
);

/**
 * @route   GET /api/auth/facebook
 * @desc    Authentification Facebook
 * @access  Public
 */
router.get('/facebook',
  passport.authenticate('facebook', {
    scope: ['email']
  })
);

/**
 * @route   GET /api/auth/facebook/callback
 * @desc    Callback Facebook OAuth
 * @access  Public
 */
router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    failureRedirect: '/api/auth/error',
    session: false 
  }),
  authController.oauthCallback
);

/**
 * @route   GET /api/auth/twitter
 * @desc    Authentification Twitter
 * @access  Public
 */
router.get('/twitter',
  passport.authenticate('twitter')
);

/**
 * @route   GET /api/auth/twitter/callback
 * @desc    Callback Twitter OAuth
 * @access  Public
 */
router.get('/twitter/callback',
  passport.authenticate('twitter', { 
    failureRedirect: '/api/auth/error',
    session: false 
  }),
  authController.oauthCallback
);

/**
 * @route   GET /api/auth/error
 * @desc    Page d'erreur OAuth
 * @access  Public
 */
router.get('/error', (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Erreur d\'authentification OAuth'
  });
});

module.exports = router;
