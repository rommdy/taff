// routes/users.js - Routes pour les utilisateurs
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const { validate, updateProfileSchema } = require('../middlewares/validation');

/**
 * @route   GET /api/users/profile
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @access  Private
 */
router.get('/profile', protect, userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Mettre à jour le profil de l'utilisateur
 * @access  Private
 */
router.put('/profile',
  protect,
  validate(updateProfileSchema),
  userController.updateProfile
);

/**
 * @route   DELETE /api/users/account
 * @desc    Supprimer le compte de l'utilisateur
 * @access  Private
 */
router.delete('/account', protect, userController.deleteAccount);

/**
 * @route   GET /api/users/:id/products
 * @desc    Obtenir les produits d'un utilisateur
 * @access  Public
 */
router.get('/:id/products', userController.getUserProducts);

module.exports = router;
