// SignUpScreen.js - Écran d'inscription connecté à l'API
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authAPI } from './src/services/api';
import { images } from './assets';
import colors from './src/theme/colors';

const SignUpScreen = ({ navigation, onSignUp }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSignUp = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    if (!password) {
      Alert.alert('Erreur', 'Veuillez entrer un mot de passe');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      // Appel à l'API d'inscription
      const response = await authAPI.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        telephone: telephone.trim() || undefined,
      });

      setLoading(false);

      if (response.success) {
        Alert.alert(
          'Inscription réussie !',
          'Votre compte a été créé avec succès',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onSignUp) {
                  onSignUp();
                } else if (navigation) {
                  navigation.goBack();
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      setLoading(false);
      console.error('Erreur d\'inscription:', error);

      let errorMessage = 'Une erreur est survenue lors de l\'inscription';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Erreur d\'inscription', errorMessage);
    }
  };

  const handleBackToLogin = () => {
    if (navigation) {
      navigation.goBack();
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
      >
        <Image
          source={images.logo}
          style={styles.logo}
        />

        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez LocProd aujourd'hui</Text>

        <TextInput
          placeholder="Nom complet"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          onChangeText={setName}
          value={name}
          autoCapitalize="words"
          editable={!loading}
        />

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

        <TextInput
          placeholder="Téléphone (optionnel)"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          onChangeText={setTelephone}
          value={telephone}
          keyboardType="phone-pad"
          editable={!loading}
        />

        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          secureTextEntry
          onChangeText={setPassword}
          value={password}
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          placeholder="Confirmer le mot de passe"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          secureTextEntry
          onChangeText={setConfirmPassword}
          value={confirmPassword}
          autoCapitalize="none"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.signUpButton, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.signUpButtonText}>S'inscrire</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Vous avez déjà un compte ?</Text>
          <TouchableOpacity onPress={handleBackToLogin} disabled={loading}>
            <Text style={styles.loginButton}>Se connecter</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
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
  signUpButton: {
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
  buttonDisabled: {
    backgroundColor: colors.textMuted,
    shadowOpacity: 0.1,
  },
  signUpButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    marginRight: 5,
    fontSize: 15,
    color: colors.textSecondary,
  },
  loginButton: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default SignUpScreen;
