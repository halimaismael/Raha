import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!firstName || !lastName || !phone || !password) {
      return Alert.alert('Champs requis', 'Merci de remplir tous les champs.');
    }
    setLoading(true);
    try {
      await register({ firstName, lastName, phone, password });
    } catch (err: any) {
      Alert.alert('Inscription impossible', err?.response?.data?.message || 'Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Créer un compte</Text>
      <Text style={styles.bodyMuted}>Rejoignez Raha en 1 minute.</Text>

      <Text style={styles.label}>Prénom</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Ali" placeholderTextColor={colors.slate} />

      <Text style={styles.label}>Nom</Text>
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Mohamed" placeholderTextColor={colors.slate} />

      <Text style={styles.label}>Numéro de téléphone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+269 3XX XX XX" keyboardType="phone-pad" placeholderTextColor={colors.slate} />

      <Text style={styles.label}>Mot de passe</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry placeholderTextColor={colors.slate} />

      <Pressable style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
        <Text style={styles.primaryBtnText}>{loading ? 'Création...' : 'Créer mon compte'}</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Déjà inscrit ? <Text style={{ fontWeight: '700' }}>Se connecter</Text></Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.sand, padding: 28, paddingTop: 70, paddingBottom: 60 },
  h1: { ...typography.display, marginBottom: 6 },
  bodyMuted: { ...typography.bodyMuted, marginBottom: 24 },
  label: { ...typography.caption, marginBottom: 6, marginTop: 14 },
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
    marginTop: 28,
  },
  primaryBtnText: { ...typography.button },
  link: { ...typography.bodyMuted, textAlign: 'center', marginTop: 20 },
});
