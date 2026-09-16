import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';

export default function ProRoleChoiceScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Espace professionnel</Text>
      <Text style={styles.bodyMuted}>Choisissez votre profil pour accéder à votre espace Raha.</Text>

      <Pressable style={styles.card} onPress={() => navigation.navigate('ProIndependentAuth')}>
        <Text style={styles.icon}>🧍</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Chauffeur indépendant</Text>
          <Text style={styles.sub}>Je gère mon propre véhicule, mes tarifs et mes disponibilités</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => navigation.navigate('ProAgencyDriverLogin')}>
        <Text style={styles.icon}>🪪</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Chauffeur d'agence</Text>
          <Text style={styles.sub}>Mon compte a été créé et activé par mon agence</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => navigation.navigate('BecomeProfessional')}>
        <Text style={styles.icon}>🏢</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Agence de transport</Text>
          <Text style={styles.sub}>Je souhaite inscrire mon agence sur la plateforme Raha</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Welcome')}>
        <Text style={styles.backLink}>‹ Ce n'est pas moi</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand, padding: 24, paddingTop: 80 },
  h1: { ...typography.display, marginBottom: 6 },
  bodyMuted: { ...typography.bodyMuted, marginBottom: 28 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  icon: { fontSize: 26, marginRight: 14 },
  title: { fontSize: 15.5, fontWeight: '800', color: colors.charcoal },
  sub: { fontSize: 12, color: colors.slate, marginTop: 3, lineHeight: 16 },
  chevron: { fontSize: 22, color: colors.slate, marginLeft: 8 },
  backLink: { ...typography.bodyMuted, textAlign: 'center', marginTop: 20 },
});
