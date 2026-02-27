// models/Product.js - Modèle produit avec système anti-doublon
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du produit est requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  prix: {
    type: String
  },
  category: {
    id: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    iconFamily: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    },
    address: {
      type: String,
      trim: true
    }
  },
  quantity: {
    type: Number,
    default: 1,
    min: [0, 'La quantité ne peut pas être négative']
  },
  images: [{
    type: String, // URL ou URI de l'image
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Liste des utilisateurs qui ont ajouté ce produit
  contributors: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['disponible', 'vendu', 'reserve'],
    default: 'disponible'
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index géospatial pour les recherches par localisation
productSchema.index({ location: '2dsphere' });

// Index pour les recherches textuelles
productSchema.index({ name: 'text', description: 'text' });

// Index composé pour le système anti-doublon
productSchema.index({ name: 1, 'category.id': 1, 'location.address': 1 });

// Méthode pour trouver les produits à proximité
productSchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // en mètres
      }
    },
    status: 'disponible'
  });
};

// Méthode statique pour trouver ou créer un produit (anti-doublon)
productSchema.statics.findOrCreate = async function(productData, userId) {
  const { name, category, location } = productData;
  
  // Chercher un produit similaire
  const query = {
    name: { $regex: new RegExp(`^${name}$`, 'i') }, // Insensible à la casse
    'category.id': category.id,
    status: 'disponible'
  };
  
  // Ajouter la condition sur l'adresse seulement si location existe
  if (location && location.address) {
    query['location.address'] = location.address;
  } else {
    query['location'] = { $exists: false };
  }
  
  const existingProduct = await this.findOne(query);

  if (existingProduct) {
    // Produit existe, augmenter la quantité
    existingProduct.quantity += 1;
    
    // Ajouter l'utilisateur aux contributeurs s'il n'y est pas déjà
    const alreadyContributor = existingProduct.contributors.some(
      c => c.user.toString() === userId.toString()
    );
    
    if (!alreadyContributor) {
      existingProduct.contributors.push({ user: userId });
    }
    
    await existingProduct.save();
    return { product: existingProduct, isNew: false };
  }

  // Créer un nouveau produit
  const newProduct = await this.create({
    ...productData,
    createdBy: userId,
    contributors: [{ user: userId }],
    quantity: 1
  });

  return { product: newProduct, isNew: true };
};

// Méthode pour décrémenter la quantité
productSchema.methods.decrementQuantity = async function(userId) {
  if (this.quantity > 1) {
    this.quantity -= 1;
    
    // Retirer l'utilisateur des contributeurs
    this.contributors = this.contributors.filter(
      c => c.user.toString() !== userId.toString()
    );
    
    await this.save();
    return { deleted: false, product: this };
  } else {
    // Si quantity = 1, supprimer le produit
    await this.deleteOne();
    return { deleted: true };
  }
};

module.exports = mongoose.model('Product', productSchema);
