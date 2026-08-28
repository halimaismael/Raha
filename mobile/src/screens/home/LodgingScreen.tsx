import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';

export default function LodgingScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 60 }}>
      <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>

      <Text style={styles.icon}>🏝️</Text>
      <Text style={typography.display}>Vous êtes-vous logé aux Comores ?</Text>
      <Text style={styles.body}>
        Raha prépare une sélection d'hébergements partout en Grande Comore — hôtels, maisons d'hôtes et
        résidences — pour vous accompagner du transfert aéroport jusqu'à votre porte.
      </Text>
      <Text style={styles.body}>
        En attendant l'ouverture de cette fonctionnalité, notre équipe transport reste à votre disposition
        pour organiser votre transfert aéroport et vos trajets vers votre lieu de séjour.
      </Text>

      <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('ChooseProvider', { purpose: 'Transfert aéroport', title: 'Transfert aéroport' })}>
        <Text style={styles.primaryBtnText}>Réserver mon transfert aéroport →</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate('MapExplore')}>
        <Text style={styles.secondaryBtnText}>Découvrir les endroits à visiter →</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 18, fontSize: 15 },
  icon: { fontSize: 34, marginBottom: 10 },
  body: { fontSize: 14, color: colors.slate, lineHeight: 20, marginTop: 14 },
  primaryBtn: { backgroundColor: colors.ocean, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center', marginTop: 30 },
  primaryBtnText: { ...typography.button },
  secondaryBtn: { backgroundColor: colors.white, borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: colors.line },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: colors.charcoal },
});
