// routes/reports.js - Routes pour les signalements
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification optionnelle
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }
    next();
  } catch (error) {
    // Continuer sans authentification
    next();
  }
};

// Route publique - créer un signalement (authentification optionnelle)
router.post('/', optionalAuth, reportController.createReport);

// Routes admin - protégées par clé secrète
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'LocPr0d@Adm1n#2026!Sec') {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé'
    });
  }
  next();
};

// Obtenir tous les signalements (Admin)
router.get('/admin/all', adminAuth, reportController.getAllReports);

// Obtenir les statistiques (Admin)
router.get('/admin/stats', adminAuth, reportController.getReportStats);

// Mettre à jour le statut d'un signalement (Admin)
router.put('/admin/:id', adminAuth, reportController.updateReportStatus);

// Supprimer un signalement (Admin)
router.delete('/admin/:id', adminAuth, reportController.deleteReport);

module.exports = router;
