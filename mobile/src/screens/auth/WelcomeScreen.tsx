import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';

export default function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoBadge}>
          <Image source={require('../../../assets/logo-mark.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brand}>Raha</Text>
        <Text style={styles.slogan}>Votre trajet, notre priorité</Text>
        <Text style={styles.tagline}>Bus, taxis et camions{'\n'}partout en Grande Comore</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.h1}>Bienvenue</Text>
        <Text style={styles.body}>
          Dites-nous qui vous êtes pour vous proposer la bonne expérience Raha.
        </Text>

        <Pressable style={styles.roleCard} onPress={() => navigation.navigate('UserWelcome')}>
          <Text style={styles.roleIcon}>🧳</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.roleTitle}>Je suis un usager</Text>
            <Text style={styles.roleSub}>Je réserve un bus, un taxi ou un camion</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable style={[styles.roleCard, styles.roleCardDark]} onPress={() => navigation.navigate('ProRoleChoice')}>
          <Text style={styles.roleIcon}>🚐</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.roleTitle, { color: colors.white }]}>Je suis un professionnel</Text>
            <Text style={[styles.roleSub, { color: colors.sand }]}>Chauffeur indépendant, chauffeur d'agence ou agence</Text>
          </View>
          <Text style={[styles.chevron, { color: colors.white }]}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ocean },
  hero: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: 18,
  },
  logo: { width: '100%', height: '100%' },
  brand: { fontSize: 34, fontWeight: '800', color: colors.white, letterSpacing: -1 },
  slogan: { fontSize: 16, fontStyle: 'italic', color: colors.ylang, marginTop: 6 },
  tagline: { fontSize: 17, color: colors.sand, marginTop: 14, lineHeight: 24 },
  card: {
    backgroundColor: colors.sand,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingBottom: 40,
  },
  h1: { ...typography.h1, marginBottom: 8 },
  body: { ...typography.bodyMuted, marginBottom: 22, lineHeight: 21 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  roleCardDark: { backgroundColor: colors.onyx, borderColor: colors.onyx },
  roleIcon: { fontSize: 26, marginRight: 14 },
  roleTitle: { fontSize: 15.5, fontWeight: '800', color: colors.charcoal },
  roleSub: { fontSize: 12, color: colors.slate, marginTop: 2 },
  chevron: { fontSize: 22, color: colors.slate, marginLeft: 8 },
});
