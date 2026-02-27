// routes/admin.js - Routes admin complètes
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middlewares/auth');
const { validate, updateUserByAdminSchema, createProductSchema, updateProductSchema } = require('../middlewares/validation');

// Toutes les routes admin nécessitent authentification + rôle admin
router.use(protect, isAdmin);

// ===== GESTION DES UTILISATEURS =====

/**
 * @route   GET /api/admin/users
 * @desc    Obtenir tous les utilisateurs
 * @access  Private/Admin
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Obtenir un utilisateur par ID
 * @access  Private/Admin
 */
router.get('/users/:id', adminController.getUserById);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Private/Admin
 */
router.put('/users/:id',
  validate(updateUserByAdminSchema),
  adminController.updateUser
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Private/Admin
 */
router.delete('/users/:id', adminController.deleteUser);

/**
 * @route   PATCH /api/admin/users/:id/toggle-status
 * @desc    Activer/Désactiver un compte utilisateur
 * @access  Private/Admin
 */
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);

// ===== GESTION DES PRODUITS =====

/**
 * @route   GET /api/admin/products
 * @desc    Obtenir tous les produits
 * @access  Private/Admin
 */
router.get('/products', adminController.getAllProducts);

/**
 * @route   GET /api/admin/products/:id
 * @desc    Obtenir un produit par ID
 * @access  Private/Admin
 */
router.get('/products/:id', adminController.getProductById);

/**
 * @route   POST /api/admin/products
 * @desc    Créer un produit (admin peut créer pour n'importe quel utilisateur)
 * @access  Private/Admin
 */
router.post('/products',
  validate(createProductSchema),
  adminController.createProduct
);

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Mettre à jour un produit
 * @access  Private/Admin
 */
router.put('/products/:id',
  validate(updateProductSchema),
  adminController.updateProduct
);

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Supprimer un produit définitivement
 * @access  Private/Admin
 */
router.delete('/products/:id', adminController.deleteProduct);

// ===== STATISTIQUES =====

/**
 * @route   GET /api/admin/stats
 * @desc    Obtenir les statistiques
 * @access  Private/Admin
 */
router.get('/stats', adminController.getStats);

module.exports = router;
