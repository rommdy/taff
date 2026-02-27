// scripts/createAdmin.js - Script pour créer un compte administrateur
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connexion à MongoDB
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/locprod', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');

    // Données de l'admin
    const adminData = {
      name: 'Super Admin',
      email: 'admin@locprod.com',
      password: 'admin123', // À changer en production !
      phone: '0600000000',
      role: 'admin',
    };

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('⚠️  Un administrateur avec cet email existe déjà');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Nom:', existingAdmin.name);
      console.log('🛡️  Rôle:', existingAdmin.role);
      
      // Proposer de mettre à jour le rôle
      if (existingAdmin.role !== 'admin') {
        console.log('\n🔄 Mise à jour du rôle en admin...');
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Rôle mis à jour avec succès !');
      }
      
      await mongoose.connection.close();
      return;
    }

    // Hasher le mot de passe
    console.log('\n🔐 Hashage du mot de passe...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Créer l'admin
    console.log('👤 Création du compte administrateur...');
    const admin = new User({
      name: adminData.name,
      email: adminData.email,
      password: hashedPassword,
      phone: adminData.phone,
      role: 'admin',
      isActive: true,
    });

    await admin.save();

    console.log('\n✅ Compte administrateur créé avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Mot de passe:', adminData.password);
    console.log('👤 Nom:', adminData.name);
    console.log('📱 Téléphone:', adminData.phone);
    console.log('🛡️  Rôle:', admin.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion !');
    console.log('\n🚀 Vous pouvez maintenant vous connecter avec ces identifiants.');

    // Fermer la connexion
    await mongoose.connection.close();
    console.log('\n👋 Déconnexion de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Exécuter le script
console.log('🛡️  Script de création d\'administrateur LocProd');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
createAdmin();
