import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';

// Écran d'explication affiché avant de lancer une course "Courses en ville"
// (service "Courses" de MesServicesScreen / raccourci du menu latéral).
export default function CoursesIntroScreen({ route, navigation }: any) {
  const { purpose, title } = route.params || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}>
      <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>

      <Image source={require('../../../assets/services/courses.jpg')} style={styles.image} resizeMode="cover" />

      <Text style={typography.display}>Faites vos courses avec Raha</Text>
      <Text style={styles.body}>
        Besoin d'aller au marché, en pharmacie ou faire vos achats en ville ? Un chauffeur Raha vous accompagne ou
        s'en charge à votre place, selon vos besoins. Indiquez simplement où il doit passer vous prendre (ou vous
        déposer), et nous vous montrons les véhicules disponibles avec leur prix.
      </Text>

      <View style={styles.stepsCard}>
        <Step icon="📍" text="Indiquez votre lieu de prise en charge" />
        <Step icon="🚗" text="Choisissez une agence ou un chauffeur indépendant" />
        <Step icon="💳" text="Voyez le prix avant de confirmer" />
      </View>

      <Pressable
        style={styles.cta}
        onPress={() => navigation.navigate('ChooseProvider', { purpose: purpose || 'Course en ville', title: title || 'Faites vos courses avec Raha' })}
      >
        <Text style={styles.ctaText}>Continuer</Text>
      </Pressable>
    </ScrollView>
  );
}

function Step({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.step}>
      <Text style={styles.stepIcon}>{icon}</Text>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  image: { width: '100%', height: 160, borderRadius: radius.lg, marginBottom: 20 },
  body: { ...typography.bodyMuted, marginTop: 10, lineHeight: 21 },
  stepsCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, marginTop: 24, borderWidth: 1, borderColor: colors.line },
  step: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  stepIcon: { fontSize: 18 },
  stepText: { ...typography.body, flex: 1, fontSize: 13.5 },
  cta: { backgroundColor: colors.coral, borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center', marginTop: 30 },
  ctaText: { ...typography.button, fontSize: 16 },
});
