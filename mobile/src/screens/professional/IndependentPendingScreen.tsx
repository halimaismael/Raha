import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, typography } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

// Affiché à la place de l'espace professionnel tant que le dossier du
// chauffeur indépendant n'a pas été validé par Raha (statut PENDING). Une
// fois validé (statut APPROVED), le RootNavigator bascule automatiquement
// vers l'espace professionnel complet dès que le profil est rafraîchi.
export default function IndependentPendingScreen() {
  const { independentProfile, refreshProfile, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [])
  );

  async function handleRefresh() {
    setChecking(true);
    try {
      await refreshProfile();
    } finally {
      setChecking(false);
    }
  }

  const suspended = independentProfile?.status === 'SUSPENDED';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>{suspended ? '⛔' : '⏳'}</Text>
        <Text style={styles.title}>
          {suspended ? 'Compte suspendu' : 'En attente de validation'}
        </Text>
        <Text style={styles.body}>
          {suspended
            ? "Votre compte a été suspendu par la plateforme. Contactez le support Raha pour plus d'informations."
            : `Bonjour ${independentProfile?.firstName || ''}, votre dossier est en cours de vérification par notre équipe. Une fois validé, votre identifiant professionnel Raha (RAHA-CH-xxxxxx) vous sera attribué et cet écran laissera place à votre espace chauffeur. Patientez un instant.`}
        </Text>

        {!suspended && (
          <Pressable style={styles.refreshBtn} onPress={handleRefresh} disabled={checking}>
            {checking ? <ActivityIndicator color={colors.white} /> : <Text style={styles.refreshBtnText}>Actualiser</Text>}
          </Pressable>
        )}

        <Pressable
          style={styles.logoutBtn}
          onPress={() => Alert.alert('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Se déconnecter', style: 'destructive', onPress: logout },
          ])}
        >
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: colors.line, width: '100%' },
  icon: { fontSize: 40, marginBottom: 14 },
  title: { ...typography.h1, marginBottom: 10, textAlign: 'center' },
  body: { ...typography.bodyMuted, textAlign: 'center', lineHeight: 21 },
  refreshBtn: { backgroundColor: colors.ocean, borderRadius: radius.pill, paddingVertical: 14, paddingHorizontal: 32, marginTop: 24 },
  refreshBtnText: { ...typography.button },
  logoutBtn: { marginTop: 18, paddingVertical: 8 },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 13.5 },
});
