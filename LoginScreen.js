// LoginScreen.js - Écran de connexion connecté à l'API avec mode invité
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert, Image, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { authAPI } from './src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { images } from './assets';
import colors from './src/theme/colors';

const LoginScreen = ({ onLogin, navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Identifiants admin
  const ADMIN_EMAIL = 'rmendy777@gmail.com';
  const ADMIN_PASSWORD = 'LocPr0d@Adm1n#2026!Sec';

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    if (!password) {
      Alert.alert('Erreur', 'Veuillez entrer votre mot de passe');
      return;
    }

    setLoading(true);

    // Vérifier si c'est une connexion admin
    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Stocker le flag admin
      await AsyncStorage.setItem('isAdmin', 'true');
      await AsyncStorage.setItem('adminEmail', ADMIN_EMAIL);
      
      setLoading(false);
      Alert.alert('Connexion Administrateur', 'Bienvenue Admin !\n\nVous avez accès complet à tous les produits.', [
        {
          text: 'OK',
          onPress: () => {
            if (onLogin) {
              onLogin();
            }
          }
        }
      ]);
      return;
    }

    try {
      // Appel à l'API de connexion pour les utilisateurs normaux
      const response = await authAPI.login(email.trim().toLowerCase(), password);

      setLoading(false);

      if (response.success && response.token) {
        // Réinitialiser le flag admin pour les utilisateurs normaux
        await AsyncStorage.setItem('isAdmin', 'false');
        await AsyncStorage.removeItem('adminEmail');
        
        // Connexion réussie
        Alert.alert('Connexion réussie', `Bienvenue ${response.user?.name || ''}!`);
        if (onLogin) {
          onLogin();
        }
      }
    } catch (error) {
      setLoading(false);
      console.error('Erreur de connexion:', error);

      let errorMessage = 'Une erreur est survenue lors de la connexion';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Erreur de connexion', errorMessage);
    }
  };

  const handleSignUp = () => {
    if (navigation) {
      navigation.navigate('SignUp');
    } else {
      Alert.alert('Navigation', 'Veuillez configurer la navigation vers SignUpScreen');
    }
  };

  const handleGuestMode = async () => {
    try {
      // Marquer l'utilisateur comme invité
      await AsyncStorage.setItem('guestMode', 'true');
      // Réinitialiser le flag admin
      await AsyncStorage.setItem('isAdmin', 'false');
      await AsyncStorage.removeItem('adminEmail');
      
      Alert.alert(
        'Mode Invité',
        'Vous pouvez consulter les produits, mais vous devrez créer un compte pour ajouter des produits.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onLogin) {
                onLogin();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur mode invité:', error);
      Alert.alert('Erreur', 'Impossible d\'activer le mode invité');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Image
            source={images.logo} 
            style={styles.logo}
          />
          
          <Text style={styles.title}>Bienvenue sur LocProd</Text>
          <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Mot de passe"
              placeholderTextColor={colors.textMuted}
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
              value={password}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <FontAwesome
                name={showPassword ? "eye" : "eye-slash"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.loginButtonText}>Se Connecter</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Vous n'avez pas de compte ?</Text>
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
              <Text style={styles.signUpButton}>Inscrivez-vous</Text>
            </TouchableOpacity>
          </View>

          {/* Séparateur */}
          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>OU</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Bouton Mode Invité */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestMode}
            disabled={loading}
          >
            <FontAwesome name="user-secret" size={20} color={colors.textSecondary} />
            <Text style={styles.guestButtonText}>Continuer en tant qu'invité</Text>
          </TouchableOpacity>

          <Text style={styles.guestInfo}>
            En mode invité, vous pouvez consulter les produits{"\n"}
            mais pas en ajouter.
          </Text>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    borderRadius: 75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 25,
    width: '100%',
    marginBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    fontSize: 16,
    color: colors.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 25,
    width: '100%',
    marginBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    height: '100%',
  },
  eyeIcon: {
    padding: 5,
  },
  signUpContainer: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signUpText: {
    marginRight: 5,
    fontSize: 15,
    color: colors.textSecondary,
  },
  signUpButton: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: colors.textMuted,
    shadowOpacity: 0.1,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
    width: '100%',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '100%',
    borderWidth: 2,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  guestButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  guestInfo: {
    marginTop: 15,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
