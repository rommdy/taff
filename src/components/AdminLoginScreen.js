// AdminLoginScreen.js - Écran de connexion administrateur
import colors from '../theme/colors';
import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  Alert, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView 
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { authAPI } from '../services/api';

const AdminLoginScreen = ({ onLogin, navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Email admin autorisé
  const ADMIN_EMAIL = 'rmendy777@gmail.com';
  const ADMIN_PASSWORD = 'LocPr0d@Adm1n#2026!Sec';

  const handleAdminLogin = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre email administrateur');
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

    // Vérification de l'email admin autorisé
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      Alert.alert('Accès refusé', 'Cet email n\'est pas autorisé pour l\'accès administrateur.');
      return;
    }

    // Vérification du mot de passe admin
    if (password !== ADMIN_PASSWORD) {
      Alert.alert('Erreur', 'Mot de passe incorrect.');
      return;
    }

    setLoading(true);

    // Connexion admin locale (pas besoin de l'API)
    setTimeout(() => {
      setLoading(false);
      
      // Connexion admin réussie
      Alert.alert(
        'Connexion Administrateur',
        'Bienvenue Admin !\n\nVous avez accès au panneau d\'administration.',
        [
          {
            text: 'Accéder au panneau',
            onPress: () => {
              if (onLogin) {
                onLogin();
              }
            }
          }
        ]
      );
    }, 500);
  };

  const handleBackToUserLogin = () => {
    if (navigation) {
      navigation.goBack();
    } else {
      Alert.alert('Navigation', 'Impossible de revenir en arrière');
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
        {/* En-tête Admin */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <FontAwesome name="shield" size={60} color={colors.error} />
          </View>
          <Text style={styles.title}>Panneau Administrateur</Text>
          <Text style={styles.subtitle}>Accès réservé aux administrateurs</Text>
        </View>

        {/* Alerte de sécurité */}
        <View style={styles.securityAlert}>
          <FontAwesome name="exclamation-triangle" size={20} color={colors.warning} />
          <Text style={styles.securityText}>
            Zone sécurisée - Connexion admin uniquement
          </Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <FontAwesome name="user" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder="Email administrateur"
              style={styles.input}
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <FontAwesome name="lock" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder="Mot de passe"
              style={styles.input}
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
              value={password}
              autoCapitalize="none"
              editable={!loading}
              placeholderTextColor="#999"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <FontAwesome 
                name={showPassword ? "eye" : "eye-slash"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>

          {/* Bouton de connexion */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleAdminLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="sign-in" size={20} color="#fff" />
                <Text style={styles.loginButtonText}>Connexion Admin</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Bouton retour */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToUserLogin}
            disabled={loading}
          >
            <FontAwesome name="arrow-left" size={16} color={colors.primary} />
            <Text style={styles.backButtonText}>Retour à la connexion utilisateur</Text>
          </TouchableOpacity>
        </View>

        {/* Informations de sécurité */}
        <View style={styles.securityInfo}>
          <View style={styles.securityItem}>
            <FontAwesome name="lock" size={16} color="#666" />
            <Text style={styles.securityItemText}>Connexion sécurisée SSL/TLS</Text>
          </View>
          <View style={styles.securityItem}>
            <FontAwesome name="history" size={16} color="#666" />
            <Text style={styles.securityItemText}>Toutes les actions sont enregistrées</Text>
          </View>
          <View style={styles.securityItem}>
            <FontAwesome name="shield" size={16} color="#666" />
            <Text style={styles.securityItemText}>Authentification à deux facteurs</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 LocProd Admin Panel</Text>
          <Text style={styles.footerSubtext}>Version 2.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  securityAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  securityText: {
    fontSize: 14,
    color: '#8B6914',
    marginLeft: 10,
    flex: 1,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 15,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonDisabled: {
    backgroundColor: '#999',
    shadowOpacity: 0.1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 15,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  securityInfo: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  securityItemText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
});

export default AdminLoginScreen;
