// controllers/userController.js - Contrôleur utilisateur
const User = require('../models/User');
const logger = require('../config/logger');

/**
 * @desc    Obtenir le profil de l'utilisateur connecté
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('products');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Erreur getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Mettre à jour le profil de l'utilisateur
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, firstName, username, email, telephone, adresse, avatar, bio, password, settings } = req.validatedBody;
    
    const user = await User.findById(req.userId).select('+password');
    
    if (name) user.name = name;
    if (firstName !== undefined) user.firstName = firstName;
    if (username !== undefined) user.username = username;
    if (email) user.email = email;
    if (telephone !== undefined) user.telephone = telephone;
    if (adresse !== undefined) user.adresse = adresse;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (password) user.password = password;
    if (settings) user.settings = { ...user.settings, ...settings };
    
    await user.save();
    
    logger.info(`Profil mis à jour: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user
    });
  } catch (error) {
    logger.error('Erreur updateProfile:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Cet email ou nom d\'utilisateur est déjà utilisé'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Supprimer le compte de l'utilisateur
 * @route   DELETE /api/users/account
 * @access  Private
 */
exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    await User.findByIdAndDelete(req.userId);
    
    logger.info(`Compte supprimé: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Compte supprimé avec succès'
    });
  } catch (error) {
    logger.error('Erreur deleteAccount:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

/**
 * @desc    Obtenir les produits d'un utilisateur
 * @route   GET /api/users/:id/products
 * @access  Public
 */
exports.getUserProducts = async (req, res) => {
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
      products: user.products
    });
  } catch (error) {
    logger.error('Erreur getUserProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};

module.exports = exports;
