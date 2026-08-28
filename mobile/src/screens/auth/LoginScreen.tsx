import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!phone || !password) return Alert.alert('Champs requis', 'Entrez votre numéro et mot de passe.');
    setLoading(true);
    try {
      await login(phone, password);
    } catch (err: any) {
      Alert.alert('Connexion impossible', err?.response?.data?.message || 'Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.h1}>Connexion</Text>
      <Text style={styles.bodyMuted}>Accédez à vos réservations et suivez vos trajets.</Text>

      <Text style={styles.label}>Numéro de téléphone</Text>
      <TextInput
        style={styles.input}
        placeholder="+269 3XX XX XX"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
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

      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Pas encore de compte ? <Text style={{ fontWeight: '700' }}>S'inscrire</Text></Text>
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
  link: { ...typography.bodyMuted, textAlign: 'center', marginTop: 20 },
});
