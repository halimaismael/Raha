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
          Réservez un bus, un taxi privé ou un camion pour vos déménagements,
          en quelques secondes, où que vous soyez à Ngazidja.
        </Text>

        <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.primaryBtnText}>Créer un compte</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.secondaryBtnText}>J'ai déjà un compte</Text>
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
  body: { ...typography.bodyMuted, marginBottom: 24, lineHeight: 21 },
  primaryBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { ...typography.button },
  secondaryBtn: {
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.ocean,
  },
  secondaryBtnText: { ...typography.button, color: colors.ocean },
});
