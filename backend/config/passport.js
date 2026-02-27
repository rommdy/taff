// config/passport.js - Configuration Passport.js pour OAuth
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const User = require('../models/User');
const logger = require('./logger');

// Sérialisation de l'utilisateur
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Désérialisation de l'utilisateur
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ===== GOOGLE STRATEGY =====
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Vérifier si l'utilisateur existe déjà
          let user = await User.findOne({
            $or: [
              { providerId: profile.id, provider: 'google' },
              { email: profile.emails[0].value }
            ]
          });

          if (user) {
            // Utilisateur existe, mettre à jour les infos si nécessaire
            if (!user.provider) {
              user.provider = 'google';
              user.providerId = profile.id;
              user.avatar = profile.photos[0]?.value;
              await user.save();
            }
            return done(null, user);
          }

          // Créer un nouvel utilisateur
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0]?.value,
            provider: 'google',
            providerId: profile.id,
            role: 'user',
          });

          logger.info(`Nouvel utilisateur créé via Google: ${user.email}`);
          done(null, user);
        } catch (error) {
          logger.error('Erreur Google OAuth:', error);
          done(error, null);
        }
      }
    )
  );
}

// ===== FACEBOOK STRATEGY =====
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'displayName', 'email', 'photos'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({
            $or: [
              { providerId: profile.id, provider: 'facebook' },
              { email: profile.emails?.[0]?.value }
            ]
          });

          if (user) {
            if (!user.provider) {
              user.provider = 'facebook';
              user.providerId = profile.id;
              user.avatar = profile.photos?.[0]?.value;
              await user.save();
            }
            return done(null, user);
          }

          user = await User.create({
            name: profile.displayName,
            email: profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
            avatar: profile.photos?.[0]?.value,
            provider: 'facebook',
            providerId: profile.id,
            role: 'user',
          });

          logger.info(`Nouvel utilisateur créé via Facebook: ${user.email}`);
          done(null, user);
        } catch (error) {
          logger.error('Erreur Facebook OAuth:', error);
          done(error, null);
        }
      }
    )
  );
}

// ===== TWITTER STRATEGY =====
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: process.env.TWITTER_CALLBACK_URL,
        includeEmail: true,
      },
      async (token, tokenSecret, profile, done) => {
        try {
          let user = await User.findOne({
            $or: [
              { providerId: profile.id, provider: 'twitter' },
              { email: profile.emails?.[0]?.value }
            ]
          });

          if (user) {
            if (!user.provider) {
              user.provider = 'twitter';
              user.providerId = profile.id;
              user.avatar = profile.photos?.[0]?.value;
              await user.save();
            }
            return done(null, user);
          }

          user = await User.create({
            name: profile.displayName,
            email: profile.emails?.[0]?.value || `${profile.username}@twitter.com`,
            avatar: profile.photos?.[0]?.value,
            provider: 'twitter',
            providerId: profile.id,
            role: 'user',
          });

          logger.info(`Nouvel utilisateur créé via Twitter: ${user.email}`);
          done(null, user);
        } catch (error) {
          logger.error('Erreur Twitter OAuth:', error);
          done(error, null);
        }
      }
    )
  );
}

module.exports = passport;
