import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';

// Étape "Agence / Particulier" spécifique à la location de voiture — distincte
// de ChooseProviderScreen (qui sert au flux trajet avec chauffeur) car ici
// l'usager ne choisit pas un chauffeur mais un propriétaire de véhicule.
export default function RentalProviderChoiceScreen({ navigation }: any) {
  function choose(ownerType?: 'AGENCE' | 'PARTICULIER') {
    navigation.navigate('RentalFilters', { ownerType });
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>
      <Text style={typography.display}>Louer auprès de qui ?</Text>
      <Text style={typography.bodyMuted}>Choisissez une agence ou un particulier pour louer votre véhicule.</Text>

      <Pressable style={styles.card} onPress={() => choose('AGENCE')}>
        <Text style={styles.icon}>🏢</Text>
        <View style={{ flex: 1 }}>
          <Text style={typography.h1}>Une agence</Text>
          <Text style={typography.bodyMuted}>Véhicules professionnels, contrat de location</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => choose('PARTICULIER')}>
        <Text style={styles.icon}>🚗</Text>
        <View style={{ flex: 1 }}>
          <Text style={typography.h1}>Un particulier</Text>
          <Text style={typography.bodyMuted}>Véhicules mis en location par des particuliers</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.cardAll} onPress={() => choose(undefined)}>
        <Text style={styles.allText}>Voir toutes les options (agences + particuliers)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand, padding: 20, paddingTop: 60 },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, marginTop: 20, borderWidth: 1, borderColor: colors.line, gap: 16 },
  icon: { fontSize: 32 },
  chevron: { fontSize: 24, color: colors.slate },
  cardAll: { alignItems: 'center', paddingVertical: 18, marginTop: 8 },
  allText: { fontSize: 13, fontWeight: '700', color: colors.gold },
});
