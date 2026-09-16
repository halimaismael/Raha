import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function ProIndependentAuthScreen({ navigation }: any) {
  const { loginIndependentDriver, registerIndependentDriver } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // En connexion : numéro de téléphone OU identifiant professionnel RAHA-CH-xxxxxx.
  // En inscription : uniquement le numéro de téléphone.
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [zones, setZones] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!identifier || !password) return Alert.alert('Champs requis', 'Entrez votre identifiant et votre mot de passe.');
    setLoading(true);
    try {
      await loginIndependentDriver(identifier, password);
    } catch (err: any) {
      Alert.alert('Connexion impossible', err?.response?.data?.message || 'Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!firstName || !lastName || !identifier || !password) {
      return Alert.alert('Champs requis', 'Merci de remplir tous les champs.');
    }
    setLoading(true);
    try {
      await registerIndependentDriver({
        firstName, lastName, phone: identifier, password,
        zones: zones ? zones.split(',').map((z) => z.trim()).filter(Boolean) : [],
      });
      Alert.alert(
        'Inscription reçue',
        "Votre dossier va être vérifié par notre équipe. Une fois validé, vous recevrez votre identifiant professionnel Raha (RAHA-CH-xxxxxx) — reconnectez-vous alors avec cet identifiant (ou votre numéro) et le mot de passe que vous venez de créer.",
        [{ text: 'Me connecter', onPress: () => { setPassword(''); setMode('login'); } }]
      );
    } catch (err: any) {
      Alert.alert('Inscription impossible', err?.response?.data?.message || 'Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.h1}>Chauffeur indépendant</Text>
        <Text style={styles.bodyMuted}>
          {mode === 'login' ? 'Connectez-vous à votre espace professionnel.' : 'Créez votre compte. Votre dossier sera ensuite vérifié par Raha.'}
        </Text>

        <View style={styles.tabs}>
          <Pressable style={[styles.tab, mode === 'login' && styles.tabActive]} onPress={() => setMode('login')}>
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Se connecter</Text>
          </Pressable>
          <Pressable style={[styles.tab, mode === 'register' && styles.tabActive]} onPress={() => setMode('register')}>
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Créer un compte</Text>
          </Pressable>
        </View>

        {mode === 'register' && (
          <>
            <Text style={styles.label}>Prénom</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Ali" placeholderTextColor={colors.slate} />
            <Text style={styles.label}>Nom</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Mohamed" placeholderTextColor={colors.slate} />
          </>
        )}

        <Text style={styles.label}>{mode === 'login' ? 'Identifiant professionnel (RAHA-CH-xxxxxx) ou numéro (avant validation)' : 'Numéro de téléphone'}</Text>
        <TextInput
          style={styles.input}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder={mode === 'login' ? 'RAHA-CH-000123 ou +269 3XX XX XX' : '+269 3XX XX XX'}
          keyboardType={mode === 'login' ? 'default' : 'phone-pad'}
          autoCapitalize="characters"
          placeholderTextColor={colors.slate}
        />
        {mode === 'login' && (
          <Text style={styles.hint}>
            Une fois votre dossier validé, seul votre identifiant RAHA-CH-xxxxxx fonctionne (le numéro de téléphone n'est plus accepté).
          </Text>
        )}

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry placeholderTextColor={colors.slate} />

        {mode === 'register' && (
          <>
            <Text style={styles.label}>Zones desservies (séparées par des virgules)</Text>
            <TextInput style={styles.input} value={zones} onChangeText={setZones} placeholder="Moroni, Mitsamiouli" placeholderTextColor={colors.slate} />
          </>
        )}

        <Pressable style={styles.primaryBtn} onPress={mode === 'login' ? handleLogin : handleRegister} disabled={loading}>
          <Text style={styles.primaryBtnText}>
            {loading ? 'Veuillez patienter...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte professionnel'}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>‹ Retour</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand, padding: 28, paddingTop: 70 },
  h1: { ...typography.display, marginBottom: 6 },
  bodyMuted: { ...typography.bodyMuted, marginBottom: 20 },
  tabs: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.pill, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.line },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  tabActive: { backgroundColor: colors.ocean },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.slate },
  tabTextActive: { color: colors.white },
  label: { ...typography.caption, marginBottom: 6, marginTop: 14 },
  hint: { fontSize: 11.5, color: colors.slate, marginTop: 6, lineHeight: 15 },
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
