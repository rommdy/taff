// Report.js - Modèle pour les signalements de produits
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Peut être null si signalement anonyme
  },
  reporterEmail: {
    type: String,
    required: false
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'inappropriate', // Contenu inapproprié
      'spam', // Spam ou publicité
      'fake', // Fausse information
      'duplicate', // Produit en double
      'expired', // Produit expiré/plus disponible
      'wrong_location', // Mauvaise localisation
      'other' // Autre raison
    ]
  },
  description: {
    type: String,
    required: false,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    required: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  reviewedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Index pour rechercher rapidement les signalements par produit ou statut
reportSchema.index({ product: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
