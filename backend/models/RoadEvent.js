// models/RoadEvent.js - Modèle pour les événements routiers (police, accident, bouchon)
const mongoose = require('mongoose');

const roadEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['police', 'accident', 'traffic', 'hazard', 'roadwork'],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: String
  },
  description: {
    type: String,
    maxlength: 200
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confirmations: {
    type: Number,
    default: 1
  },
  confirmedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index géospatial pour les recherches par proximité
roadEventSchema.index({ location: '2dsphere' });

// Index pour l'expiration automatique (TTL)
roadEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Méthode statique pour obtenir la durée de vie selon le type
roadEventSchema.statics.getExpirationTime = function(type) {
  const now = new Date();
  switch(type) {
    case 'police':
      // Police: 24 heures
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'accident':
    case 'traffic':
    case 'hazard':
      // Accident, bouchon, danger: 30 minutes
      return new Date(now.getTime() + 30 * 60 * 1000);
    case 'roadwork':
      // Travaux: 7 jours
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 30 * 60 * 1000);
  }
};

// Méthode pour prolonger la durée de vie lors d'une confirmation
roadEventSchema.methods.confirm = function(userId) {
  if (!this.confirmedBy.includes(userId)) {
    this.confirmedBy.push(userId);
    this.confirmations += 1;
    
    // Prolonger de 15 minutes pour chaque confirmation (sauf police)
    if (this.type !== 'police') {
      this.expiresAt = new Date(this.expiresAt.getTime() + 15 * 60 * 1000);
    }
  }
  return this.save();
};

module.exports = mongoose.model('RoadEvent', roadEventSchema);
