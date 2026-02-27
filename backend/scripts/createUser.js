// scripts/createUser.js - Script pour créer un compte utilisateur de test
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createUser = async () => {
  try {
    // Connexion à MongoDB
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/locprod', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');

    // Données de l'utilisateur
    const userData = {
      name: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      password: 'user123', // Mot de passe simple pour les tests
      phone: '0612345678',
      role: 'user',
    };

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log('⚠️  Un utilisateur avec cet email existe déjà');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Nom:', existingUser.name);
      console.log('🛡️  Rôle:', existingUser.role);
      
      await mongoose.connection.close();
      return;
    }

    // Créer l'utilisateur (le mot de passe sera hashé automatiquement par le hook pre-save)
    console.log('👤 Création du compte utilisateur...');
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: userData.password, // Le hook pre-save va le hasher
      telephone: userData.phone,
      role: 'user',
      isActive: true,
    });

    await user.save();

    console.log('\n✅ Compte utilisateur créé avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', userData.email);
    console.log('🔑 Mot de passe:', userData.password);
    console.log('👤 Nom:', userData.name);
    console.log('📱 Téléphone:', userData.phone);
    console.log('🛡️  Rôle:', user.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 Vous pouvez maintenant vous connecter avec ces identifiants.');

    // Fermer la connexion
    await mongoose.connection.close();
    console.log('\n👋 Déconnexion de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Exécuter le script
console.log('👤 Script de création d\'utilisateur LocProd');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
createUser();
