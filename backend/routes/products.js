// routes/products.js - Routes pour les produits avec anti-doublon
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, optionalAuth } = require('../middlewares/auth');
const { validate, createProductSchema, updateProductSchema } = require('../middlewares/validation');

/**
 * @route   GET /api/products/search-similar
 * @desc    Rechercher des produits similaires (anti-doublon)
 * @access  Public
 */
router.get('/search-similar', productController.searchSimilarProducts);

/**
 * @route   GET /api/products/check-duplicate
 * @desc    Vérifier si un produit existe déjà à un lieu donné
 * @access  Public
 */
router.get('/check-duplicate', productController.checkDuplicate);

/**
 * @route   GET /api/products
 * @desc    Obtenir tous les produits avec filtres
 * @access  Public
 */
router.get('/', optionalAuth, productController.getAllProducts);

/**
 * @route   GET /api/products/:id
 * @desc    Obtenir un produit par ID
 * @access  Public
 */
router.get('/:id', productController.getProductById);

/**
 * @route   POST /api/products
 * @desc    Créer un nouveau produit (avec système anti-doublon)
 * @access  Private
 */
router.post('/',
  protect,
  validate(createProductSchema),
  productController.createProduct
);

/**
 * @route   PUT /api/products/:id
 * @desc    Mettre à jour un produit
 * @access  Private (Owner ou Admin)
 */
router.put('/:id',
  protect,
  validate(updateProductSchema),
  productController.updateProduct
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Supprimer un produit (ou décrémenter quantity)
 * @access  Private (Owner ou Admin)
 */
router.delete('/:id', protect, productController.deleteProduct);

/**
 * @route   DELETE /api/products/admin/:id
 * @desc    Supprimer un produit (Admin avec clé secrète)
 * @access  Admin avec clé
 */
router.delete('/admin/:id', productController.adminDeleteProduct);

/**
 * @route   POST /api/products/:id/locations
 * @desc    Ajouter un nouveau lieu à un produit existant
 * @access  Private
 */
router.post('/:id/locations', protect, productController.addLocation);

module.exports = router;
