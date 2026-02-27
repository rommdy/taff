// models/User.js - Modèle utilisateur avec OAuth et rôles
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  password: {
    type: String,
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  telephone: {
    type: String,
    trim: true
  },
  adresse: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  // Paramètres utilisateur
  settings: {
    twoFactorEnabled: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    profilePublic: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true }
  },
  // OAuth fields
  provider: {
    type: String,
    enum: ['local', 'google', 'facebook', 'twitter'],
    default: 'local'
  },
  providerId: {
    type: String,
    default: null
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
userSchema.index({ email: 1 });
userSchema.index({ provider: 1, providerId: 1 });

// Hash du mot de passe avant sauvegarde (seulement pour auth locale)
userSchema.pre('save', async function(next) {
  // Ne pas hasher si le mot de passe n'est pas modifié ou si c'est OAuth
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour vérifier si l'utilisateur est admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Méthode pour obtenir les données publiques de l'utilisateur
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

// Méthode statique pour trouver ou créer un utilisateur OAuth
userSchema.statics.findOrCreateOAuth = async function(profile, provider) {
  let user = await this.findOne({
    $or: [
      { providerId: profile.id, provider },
      { email: profile.email }
    ]
  });

  if (user) {
    // Mettre à jour les infos OAuth si nécessaire
    if (!user.provider || user.provider === 'local') {
      user.provider = provider;
      user.providerId = profile.id;
      user.avatar = profile.avatar;
      await user.save();
    }
    return user;
  }

  // Créer un nouvel utilisateur
  user = await this.create({
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar,
    provider,
    providerId: profile.id,
    role: 'user',
  });

  return user;
};

module.exports = mongoose.model('User', userSchema);
