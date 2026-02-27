// routes/roadEvents.js - Routes pour les événements routiers
const express = require('express');
const router = express.Router();
const roadEventController = require('../controllers/roadEventController');
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
    next();
  }
};

// Middleware d'authentification requise
const requireAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentification requise' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

// Routes publiques
router.get('/nearby', roadEventController.getNearbyEvents);

// Routes avec authentification optionnelle
router.post('/', optionalAuth, roadEventController.createEvent);

// Routes avec authentification requise
router.post('/:eventId/confirm', requireAuth, roadEventController.confirmEvent);
router.post('/:eventId/dismiss', requireAuth, roadEventController.dismissEvent);
router.delete('/:eventId', requireAuth, roadEventController.deleteEvent);

module.exports = router;
