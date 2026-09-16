import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function ProAgencyDriverLoginScreen({ navigation }: any) {
  const { loginDriver } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!identifier || !password) return Alert.alert('Champs requis', 'Entrez votre identifiant et votre mot de passe.');
    setLoading(true);
    try {
      await loginDriver(identifier, password);
    } catch (err: any) {
      Alert.alert('Connexion impossible', err?.response?.data?.message || "Vérifiez vos identifiants, ou contactez votre agence si votre compte n'est pas encore activé.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.h1}>Chauffeur d'agence</Text>
      <Text style={styles.bodyMuted}>
        Connectez-vous avec votre identifiant professionnel Raha (RAHA-PA-xxxxxx), fourni par votre agence, et votre mot de passe.
      </Text>

      <Text style={styles.label}>Identifiant professionnel</Text>
      <TextInput
        style={styles.input}
        placeholder="RAHA-PA-000123"
        autoCapitalize="characters"
        value={identifier}
        onChangeText={setIdentifier}
        placeholderTextColor={colors.slate}
      />

      <Text style={styles.label}>Mot de passe</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={colors.slate}
      />

      <Pressable style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
        <Text style={styles.primaryBtnText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
      </Pressable>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          ℹ️ Pas encore de compte ? Votre agence doit d'abord vous ajouter comme chauffeur puis activer votre accès depuis son tableau de bord Raha.
        </Text>
      </View>

      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.link}>‹ Retour</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand, padding: 28, paddingTop: 80 },
  h1: { ...typography.display, marginBottom: 6 },
  bodyMuted: { ...typography.bodyMuted, marginBottom: 32 },
  label: { ...typography.caption, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.line,
    fontSize: 15,
    color: colors.charcoal,
  },
  primaryBtn: {
    backgroundColor: colors.ocean,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  primaryBtnText: { ...typography.button },
  infoBox: { backgroundColor: colors.sandDeep, borderRadius: radius.md, padding: 14, marginTop: 20 },
  infoText: { fontSize: 12, color: colors.slate, lineHeight: 17 },
  link: { ...typography.bodyMuted, textAlign: 'center', marginTop: 20 },
});
