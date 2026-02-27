// controllers/productController.js - Contrôleur des produits avec anti-doublon
const Product = require('../models/Product');
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * @desc    Obtenir tous les produits avec filtres
 * @route   GET /api/products
 * @access  Public
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { category, search, latitude, longitude, maxDistance, status } = req.query;
    let query = {};

    // Filtre par statut (par défaut: disponible)
    query.status = status || 'disponible';

    // Filtre par catégorie
    if (category) {
      query['category.id'] = parseInt(category);
    }

    // Recherche textuelle
    if (search) {
      query.$text = { $search: search };
    }

    let products;

    // Recherche par proximité géographique
    if (latitude && longitude) {
      products = await Product.findNearby(
        parseFloat(longitude),
        parseFloat(latitude),
        maxDistance ? parseInt(maxDistance) : 5000
      ).populate('createdBy', 'name email telephone avatar');
    } else {
      products = await Product.find(query)
        .populate('createdBy', 'name email telephone avatar')
        .populate('contributors.user', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(100);
    }

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Obtenir un produit par ID
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email telephone avatar')
      .populate('contributors.user', 'name avatar');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Incrémenter les vues
    product.views += 1;
    await product.save();

    res.json({
      success: true,
      product
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Créer un nouveau produit (avec système anti-doublon)
 * @route   POST /api/products
 * @access  Private
 */
exports.createProduct = async (req, res) => {
  try {
    const productData = req.validatedBody;

    // Utiliser la méthode findOrCreate pour gérer les doublons
    const { product, isNew } = await Product.findOrCreate(productData, req.userId);

    // Ajouter le produit à l'utilisateur si c'est nouveau
    if (isNew) {
      await User.findByIdAndUpdate(req.userId, {
        $push: { products: product._id }
      });
    }

    logger.info(`Produit ${isNew ? 'créé' : 'mis à jour (doublon)'}: ${product.name} par ${req.user.email}`);

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew 
        ? 'Produit créé avec succès' 
        : 'Ce produit existe déjà. Quantité augmentée de 1.',
      product,
      isNew
    });
  } catch (error) {
    logger.error('Erreur lors de la création du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du produit'
    });
  }
};

/**
 * @desc    Mettre à jour un produit
 * @route   PUT /api/products/:id
 * @access  Private (Owner ou Admin)
 */
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier les permissions (owner ou admin)
    if (product.createdBy.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier ce produit'
      });
    }

    const { name, description, prix, category, status, quantity } = req.validatedBody;

    // Mettre à jour les champs
    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (prix !== undefined) product.prix = prix;
    if (category) product.category = category;
    if (status) product.status = status;
    if (quantity !== undefined) product.quantity = quantity;

    await product.save();

    logger.info(`Produit mis à jour: ${product.name} par ${req.user.email}`);

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      product
    });
  } catch (error) {
    logger.error('Erreur lors de la mise à jour du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Supprimer un produit (ou décrémenter quantity)
 * @route   DELETE /api/products/:id
 * @access  Private (Owner ou Admin)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier les permissions
    const isOwner = product.createdBy.toString() === req.userId.toString();
    const isAdmin = req.user.role === 'admin';
    const isContributor = product.contributors.some(
      c => c.user.toString() === req.userId.toString()
    );

    if (!isOwner && !isAdmin && !isContributor) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer ce produit'
      });
    }

    // Si admin, supprimer complètement
    if (isAdmin) {
      await product.deleteOne();
      
      // Retirer de tous les utilisateurs
      await User.updateMany(
        { products: product._id },
        { $pull: { products: product._id } }
      );

      logger.info(`Produit supprimé par admin: ${product.name}`);

      return res.json({
        success: true,
        message: 'Produit supprimé définitivement'
      });
    }

    // Sinon, décrémenter la quantité
    const result = await product.decrementQuantity(req.userId);

    if (result.deleted) {
      // Retirer de l'utilisateur
      await User.findByIdAndUpdate(req.userId, {
        $pull: { products: product._id }
      });

      logger.info(`Produit supprimé: ${product.name}`);

      res.json({
        success: true,
        message: 'Produit supprimé avec succès'
      });
    } else {
      logger.info(`Quantité décrémentée pour: ${product.name}`);

      res.json({
        success: true,
        message: 'Quantité décrémentée de 1',
        product: result.product
      });
    }
  } catch (error) {
    logger.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Rechercher des produits similaires (anti-doublon)
 * @route   GET /api/products/search-similar
 * @access  Public
 */
exports.searchSimilarProducts = async (req, res) => {
  try {
    const { name, categoryId } = req.query;

    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et la catégorie sont requis'
      });
    }

    // Recherche insensible à la casse avec regex
    const similarProducts = await Product.find({
      name: { $regex: new RegExp(name, 'i') },
      'category.id': parseInt(categoryId),
      status: 'disponible'
    })
    .select('name description prix category location')
    .limit(5);

    res.json({
      success: true,
      count: similarProducts.length,
      products: similarProducts
    });
  } catch (error) {
    logger.error('Erreur lors de la recherche de produits similaires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Vérifier si un produit existe déjà à un lieu donné
 * @route   GET /api/products/check-duplicate
 * @access  Public
 */
exports.checkDuplicate = async (req, res) => {
  try {
    const { name, categoryId, address } = req.query;

    if (!name || !categoryId || !address) {
      return res.status(400).json({
        success: false,
        message: 'Le nom, la catégorie et l\'adresse sont requis'
      });
    }

    // Recherche exacte (insensible à la casse)
    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      'category.id': parseInt(categoryId),
      'location.address': { $regex: new RegExp(`^${address}$`, 'i') },
      status: 'disponible'
    });

    if (existingProduct) {
      return res.json({
        success: true,
        exists: true,
        product: existingProduct
      });
    }

    res.json({
      success: true,
      exists: false
    });
  } catch (error) {
    logger.error('Erreur lors de la vérification du doublon:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Ajouter un nouveau lieu à un produit existant
 * @route   POST /api/products/:id/locations
 * @access  Private
 */
exports.addLocation = async (req, res) => {
  try {
    const { coordinates, address } = req.body;

    if (!coordinates || !address) {
      return res.status(400).json({
        success: false,
        message: 'Les coordonnées et l\'adresse sont requises'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    // Vérifier si ce lieu n'existe pas déjà pour ce produit
    const locationExists = await Product.findOne({
      _id: req.params.id,
      'location.address': { $regex: new RegExp(`^${address}$`, 'i') }
    });

    if (locationExists) {
      return res.status(400).json({
        success: false,
        message: 'Ce lieu existe déjà pour ce produit'
      });
    }

    // Créer une nouvelle entrée de produit avec le nouveau lieu
    // (Alternative: vous pouvez aussi modifier le modèle pour supporter plusieurs lieux)
    const newProductLocation = new Product({
      name: product.name,
      description: product.description,
      prix: product.prix,
      category: product.category,
      location: {
        type: 'Point',
        coordinates: coordinates,
        address: address
      },
      createdBy: req.user._id,
      status: 'disponible',
      quantity: 1
    });

    await newProductLocation.save();

    // Ajouter l'utilisateur comme contributeur au produit original
    if (!product.contributors.some(c => c.user.toString() === req.user._id.toString())) {
      product.contributors.push({
        user: req.user._id,
        addedAt: new Date()
      });
      await product.save();
    }

    logger.info(`Nouveau lieu ajouté au produit ${product.name} par ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Lieu ajouté avec succès',
      product: newProductLocation
    });
  } catch (error) {
    logger.error('Erreur lors de l\'ajout du lieu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Supprimer un produit (Admin avec clé secrète)
 * @route   DELETE /api/products/admin/:id
 * @access  Admin avec clé
 */
exports.adminDeleteProduct = async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    const ADMIN_SECRET_KEY = 'LocPr0d@Adm1n#2026!Sec';

    if (adminKey !== ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Clé admin invalide'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    await product.deleteOne();
    
    // Retirer de tous les utilisateurs
    await User.updateMany(
      { products: product._id },
      { $pull: { products: product._id } }
    );

    logger.info(`Produit supprimé par admin (clé): ${product.name}`);

    res.json({
      success: true,
      message: 'Produit supprimé définitivement'
    });
  } catch (error) {
    logger.error('Erreur suppression admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = exports;
