// SettingsScreen.js - Page des paramètres complète
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { lightTheme as staticColors } from '../theme/colors';
import { usersAPI, authAPI } from '../services/api';
import { LANGUAGES, setStoredLanguage } from '../i18n';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = ({ onLogout }) => {
  const navigation = useNavigation();
  const { isDarkMode, colors: themeColors, toggleTheme } = useTheme();
  const colors = themeColors || staticColors;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Paramètres
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    profilePublic: true,
    showOnlineStatus: true,
  });

  const { t, i18n } = useTranslation();

  // États pour les modals de changement
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Obtenir la langue actuelle
  const getCurrentLanguage = () => {
    return LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];
  };

  const handleChangeLanguage = async (languageCode) => {
    try {
      setSaving(true);
      await setStoredLanguage(languageCode);
      setShowLanguageModal(false);
    } catch (error) {
      Alert.alert(t('common.error'), 'Impossible de changer la langue');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getProfile();
      if (response.success && response.user.settings) {
        setSettings({
          ...settings,
          ...response.user.settings,
        });
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await usersAPI.updateProfile({ settings: newSettings });
    } catch (error) {
      console.error('Erreur mise à jour paramètre:', error);
      // Revenir à l'ancienne valeur en cas d'erreur
      setSettings(settings);
      Alert.alert('Erreur', 'Impossible de mettre à jour ce paramètre');
    }
  };

  const handleChangePassword = () => {
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const confirmChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    try {
      setSaving(true);
      await usersAPI.updateProfile({ password: newPassword });
      setShowPasswordModal(false);
      setNewPassword('');
      Alert.alert('Succès', 'Mot de passe modifié avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = () => {
    setNewEmail('');
    setShowEmailModal(true);
  };

  const confirmChangeEmail = async () => {
    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }
    try {
      setSaving(true);
      await usersAPI.updateProfile({ email: newEmail.toLowerCase() });
      setShowEmailModal(false);
      setNewEmail('');
      Alert.alert('Succès', 'Email modifié avec succès');
    } catch (error) {
      let message = 'Impossible de modifier l\'email';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      Alert.alert('Erreur', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront supprimées définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation finale',
              'Êtes-vous vraiment sûr de vouloir supprimer votre compte ?',
              [
                { text: 'Non', style: 'cancel' },
                {
                  text: 'Oui, supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setSaving(true);
                      await usersAPI.deleteAccount();
                      Alert.alert('Compte supprimé', 'Votre compte a été supprimé');
                      if (onLogout) onLogout();
                    } catch (error) {
                      Alert.alert('Erreur', 'Impossible de supprimer le compte');
                    } finally {
                      setSaving(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLogoutAllDevices = () => {
    Alert.alert(
      'Déconnexion de tous les appareils',
      'Vous serez déconnecté de tous vos appareils, y compris celui-ci.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await authAPI.logout();
              Alert.alert('Succès', 'Vous avez été déconnecté de tous les appareils');
              if (onLogout) onLogout();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se déconnecter');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleToggle2FA = () => {
    if (!settings.twoFactorEnabled) {
      Alert.alert(
        'Activer la double authentification',
        'La double authentification ajoute une couche de sécurité supplémentaire à votre compte.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Activer',
            onPress: () => updateSetting('twoFactorEnabled', true),
          },
        ]
      );
    } else {
      Alert.alert(
        'Désactiver la double authentification',
        'Êtes-vous sûr de vouloir désactiver la double authentification ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Désactiver',
            style: 'destructive',
            onPress: () => updateSetting('twoFactorEnabled', false),
          },
        ]
      );
    }
  };

  const SettingItem = ({ icon, title, subtitle, onPress, rightComponent, danger }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <FontAwesome name={icon} size={18} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (onPress && (
        <FontAwesome name="chevron-right" size={14} color={colors.textMuted} />
      ))}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.savingText}>Enregistrement...</Text>
        </View>
      )}

      {/* Compte */}
      <SectionHeader title="Compte" />
      <View style={styles.section}>
        <SettingItem
          icon="lock"
          title="Changer le mot de passe"
          subtitle="Modifier votre mot de passe de connexion"
          onPress={handleChangePassword}
        />
        <SettingItem
          icon="envelope"
          title="Changer l'email"
          subtitle="Modifier votre adresse email"
          onPress={handleChangeEmail}
        />
        <SettingItem
          icon="trash"
          title="Supprimer le compte"
          subtitle="Supprimer définitivement votre compte"
          onPress={handleDeleteAccount}
          danger
        />
      </View>

      {/* Langue */}
      <SectionHeader title={t('settings.language')} />
      <View style={styles.section}>
        <SettingItem
          icon="globe"
          title={t('settings.selectLanguage')}
          subtitle={`${getCurrentLanguage().flag} ${getCurrentLanguage().name}`}
          onPress={() => setShowLanguageModal(true)}
        />
      </View>

      {/* Apparence */}
      <SectionHeader title="Apparence" />
      <View style={styles.section}>
        <SettingItem
          icon="moon-o"
          title="Mode sombre"
          subtitle={isDarkMode ? 'Activé' : 'Désactivé'}
          onPress={toggleTheme}
          rightComponent={
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isDarkMode ? colors.primary : colors.textMuted}
            />
          }
        />
      </View>

      {/* Sécurité */}
      <SectionHeader title="Sécurité" />
      <View style={styles.section}>
        <SettingItem
          icon="shield"
          title="Double authentification (2FA)"
          subtitle={settings.twoFactorEnabled ? 'Activée' : 'Désactivée'}
          onPress={handleToggle2FA}
          rightComponent={
            <Switch
              value={settings.twoFactorEnabled}
              onValueChange={handleToggle2FA}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.twoFactorEnabled ? colors.primary : colors.textMuted}
            />
          }
        />
        <SettingItem
          icon="sign-out"
          title="Déconnexion de tous les appareils"
          subtitle="Se déconnecter de toutes les sessions actives"
          onPress={handleLogoutAllDevices}
        />
      </View>

      {/* Notifications */}
      <SectionHeader title="Notifications" />
      <View style={styles.section}>
        <SettingItem
          icon="envelope-o"
          title="Notifications email"
          subtitle="Recevoir des notifications par email"
          rightComponent={
            <Switch
              value={settings.emailNotifications}
              onValueChange={(value) => updateSetting('emailNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.emailNotifications ? colors.primary : colors.textMuted}
            />
          }
        />
        <SettingItem
          icon="bell"
          title="Notifications push"
          subtitle="Recevoir des notifications sur votre appareil"
          rightComponent={
            <Switch
              value={settings.pushNotifications}
              onValueChange={(value) => updateSetting('pushNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.pushNotifications ? colors.primary : colors.textMuted}
            />
          }
        />
        <SettingItem
          icon="mobile"
          title="Notifications SMS"
          subtitle="Recevoir des notifications par SMS"
          rightComponent={
            <Switch
              value={settings.smsNotifications}
              onValueChange={(value) => updateSetting('smsNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.smsNotifications ? colors.primary : colors.textMuted}
            />
          }
        />
      </View>

      {/* Confidentialité */}
      <SectionHeader title="Confidentialité" />
      <View style={styles.section}>
        <SettingItem
          icon="eye"
          title="Profil public"
          subtitle={settings.profilePublic ? 'Visible par tous' : 'Visible uniquement par vous'}
          rightComponent={
            <Switch
              value={settings.profilePublic}
              onValueChange={(value) => updateSetting('profilePublic', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.profilePublic ? colors.primary : colors.textMuted}
            />
          }
        />
        <SettingItem
          icon="circle"
          title="Statut en ligne"
          subtitle={settings.showOnlineStatus ? 'Visible' : 'Masqué'}
          rightComponent={
            <Switch
              value={settings.showOnlineStatus}
              onValueChange={(value) => updateSetting('showOnlineStatus', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.showOnlineStatus ? colors.primary : colors.textMuted}
            />
          }
        />
        <SettingItem
          icon="download"
          title="Télécharger mes données"
          subtitle="Obtenir une copie de vos données personnelles"
          onPress={() => Alert.alert('Info', 'Cette fonctionnalité sera bientôt disponible')}
        />
      </View>

      {/* Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>LocProd v2.0.0</Text>
        <Text style={styles.versionSubtext}>© 2024 Tous droits réservés</Text>
      </View>

      {/* Modal Changer Email */}
      <Modal
        visible={showEmailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer l'email</Text>
            <TextInput
              style={styles.modalInput}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Entrez votre nouvel email"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowEmailModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmChangeEmail}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Changer Mot de passe */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nouveau mot de passe (min. 6 caractères)"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={true}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmChangePassword}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.modalButtonConfirmText}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Changer Langue */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '70%' }]}>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    i18n.language === language.code && styles.languageItemSelected,
                  ]}
                  onPress={() => handleChangeLanguage(language.code)}
                  disabled={saving}
                >
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <Text
                    style={[
                      styles.languageName,
                      i18n.language === language.code && styles.languageNameSelected,
                    ]}
                  >
                    {language.name}
                  </Text>
                  {i18n.language === language.code && (
                    <FontAwesome name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel, { marginTop: 15 }]}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalButtonCancelText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: staticColors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: staticColors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: staticColors.textSecondary,
  },
  savingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: staticColors.surfaceLight,
    padding: 10,
    gap: 10,
  },
  savingText: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: staticColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 25,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  section: {
    backgroundColor: staticColors.surface,
    marginHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: staticColors.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.borderLight,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: staticColors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingIconDanger: {
    backgroundColor: staticColors.errorLight,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: staticColors.text,
  },
  settingTitleDanger: {
    color: staticColors.error,
  },
  settingSubtitle: {
    fontSize: 13,
    color: staticColors.textSecondary,
    marginTop: 2,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
    color: staticColors.textSecondary,
  },
  versionSubtext: {
    fontSize: 12,
    color: staticColors.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: staticColors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: staticColors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: staticColors.border,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: staticColors.text,
    backgroundColor: staticColors.background,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: staticColors.surfaceLight,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  modalButtonConfirm: {
    backgroundColor: staticColors.primary,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: staticColors.text,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: staticColors.white,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: staticColors.background,
    borderWidth: 1,
    borderColor: staticColors.border,
  },
  languageItemSelected: {
    borderColor: staticColors.primary,
    backgroundColor: staticColors.primaryLight + '20',
  },
  languageFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: staticColors.text,
    flex: 1,
  },
  languageNameSelected: {
    color: staticColors.primary,
    fontWeight: '600',
  },
});

export default SettingsScreen;
