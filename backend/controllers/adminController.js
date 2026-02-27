// controllers/adminController.js - Contrôleur admin complet
const User = require('../models/User');
const Product = require('../models/Product');
const logger = require('../config/logger');

/**
 * @desc    Obtenir tous les utilisateurs
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive, search } = req.query;
    
    let query = {};
    
    // Filtres
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('products')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    logger.error('Erreur admin getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Obtenir un utilisateur par ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('products');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Erreur admin getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Mettre à jour un utilisateur
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive, telephone, adresse } = req.validatedBody;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'email existe déjà
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Mettre à jour les champs
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (telephone !== undefined) user.telephone = telephone;
    if (adresse !== undefined) user.adresse = adresse;

    await user.save();

    logger.info(`Utilisateur mis à jour par admin: ${user.email}`);

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user
    });
  } catch (error) {
    logger.error('Erreur admin updateUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Supprimer un utilisateur
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Ne pas permettre de supprimer son propre compte
    if (user._id.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Supprimer tous les produits de l'utilisateur
    await Product.deleteMany({ createdBy: user._id });

    // Supprimer l'utilisateur
    await user.deleteOne();

    logger.info(`Utilisateur supprimé par admin: ${user.email}`);

    res.json({
      success: true,
      message: 'Utilisateur et ses produits supprimés avec succès'
    });
  } catch (error) {
    logger.error('Erreur admin deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Désactiver/Activer un compte utilisateur
 * @route   PATCH /api/admin/users/:id/toggle-status
 * @access  Private/Admin
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Ne pas permettre de désactiver son propre compte
    if (user._id.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    logger.info(`Compte ${user.isActive ? 'activé' : 'désactivé'} par admin: ${user.email}`);

    res.json({
      success: true,
      message: `Compte ${user.isActive ? 'activé' : 'désactivé'} avec succès`,
      user
    });
  } catch (error) {
    logger.error('Erreur admin toggleUserStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Obtenir tous les produits (admin)
 * @route   GET /api/admin/products
 * @access  Private/Admin
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, status, search } = req.query;
    
    let query = {};
    
    if (category) query['category.id'] = parseInt(category);
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('createdBy', 'name email')
      .populate('contributors.user', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    logger.error('Erreur admin getAllProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Obtenir un produit par ID (admin)
 * @route   GET /api/admin/products/:id
 * @access  Private/Admin
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy')
      .populate('contributors.user');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    logger.error('Erreur admin getProductById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Créer un produit (admin peut créer pour n'importe quel utilisateur)
 * @route   POST /api/admin/products
 * @access  Private/Admin
 */
exports.createProduct = async (req, res) => {
  try {
    const productData = req.validatedBody;
    const { userId } = req.body; // ID de l'utilisateur pour qui créer le produit

    const targetUserId = userId || req.userId;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const product = await Product.create({
      ...productData,
      createdBy: targetUserId,
      contributors: [{ user: targetUserId }]
    });

    // Ajouter à l'utilisateur
    await User.findByIdAndUpdate(targetUserId, {
      $push: { products: product._id }
    });

    logger.info(`Produit créé par admin: ${product.name} pour ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      product
    });
  } catch (error) {
    logger.error('Erreur admin createProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Mettre à jour un produit (admin)
 * @route   PUT /api/admin/products/:id
 * @access  Private/Admin
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

    const { name, description, prix, category, status, quantity } = req.validatedBody;

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (prix !== undefined) product.prix = prix;
    if (category) product.category = category;
    if (status) product.status = status;
    if (quantity !== undefined) product.quantity = quantity;

    await product.save();

    logger.info(`Produit mis à jour par admin: ${product.name}`);

    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      product
    });
  } catch (error) {
    logger.error('Erreur admin updateProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Supprimer un produit définitivement (admin)
 * @route   DELETE /api/admin/products/:id
 * @access  Private/Admin
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

    await product.deleteOne();

    // Retirer de tous les utilisateurs
    await User.updateMany(
      { products: product._id },
      { $pull: { products: product._id } }
    );

    logger.info(`Produit supprimé par admin: ${product.name}`);

    res.json({
      success: true,
      message: 'Produit supprimé définitivement'
    });
  } catch (error) {
    logger.error('Erreur admin deleteProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Obtenir les statistiques
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalProducts = await Product.countDocuments();
    const availableProducts = await Product.countDocuments({ status: 'disponible' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // Produits par catégorie
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: '$category.name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Utilisateurs récents
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    // Produits récents
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          admins: totalAdmins
        },
        products: {
          total: totalProducts,
          available: availableProducts,
          sold: await Product.countDocuments({ status: 'vendu' }),
          reserved: await Product.countDocuments({ status: 'reserve' })
        },
        productsByCategory,
        recentUsers,
        recentProducts
      }
    });
  } catch (error) {
    logger.error('Erreur admin getStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = exports;
