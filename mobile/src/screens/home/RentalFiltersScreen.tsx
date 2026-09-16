import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { VehicleType } from '../../types';

const TYPES: { key: VehicleType | undefined; label: string }[] = [
  { key: undefined, label: 'Tous types' },
  { key: 'VOITURE', label: 'Voiture' },
  { key: 'TAXI', label: 'Taxi' },
  { key: 'CAMION', label: 'Camion' },
  { key: 'BUS', label: 'Bus' },
];

// Étape "filtres" avant la liste des véhicules à louer : marque + type de
// véhicule, pour affiner la recherche parmi les périodes de location actives.
export default function RentalFiltersScreen({ route, navigation }: any) {
  const { ownerType } = route.params || {};
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<VehicleType | undefined>('VOITURE');

  function search() {
    navigation.navigate('RentalVehicleList', { ownerType, type, brand: brand.trim() || undefined });
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>
      <Text style={typography.display}>Quel véhicule ?</Text>
      <Text style={typography.bodyMuted}>Indiquez la marque recherchée et le type de véhicule (optionnel).</Text>

      <Text style={styles.label}>Type de véhicule</Text>
      <View style={styles.wrapRow}>
        {TYPES.map((t) => (
          <Pressable
            key={t.label}
            style={[styles.pill, type === t.key && styles.pillActive]}
            onPress={() => setType(t.key)}
          >
            <Text style={[styles.pillText, type === t.key && styles.pillTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Marque (optionnel)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Toyota, Renault, Hyundai..."
        value={brand}
        onChangeText={setBrand}
        placeholderTextColor={colors.slate}
      />

      <Pressable style={styles.searchBtn} onPress={search}>
        <Text style={styles.searchBtnText}>Voir les véhicules disponibles</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand, padding: 20, paddingTop: 60 },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  label: { ...typography.caption, marginBottom: 8, marginTop: 24 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  pillActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.charcoal },
  pillTextActive: { color: colors.white },
  input: {
    backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.line, fontSize: 15, color: colors.charcoal,
  },
  searchBtn: { backgroundColor: colors.coral, borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center', marginTop: 36 },
  searchBtnText: { ...typography.button, fontSize: 16 },
});
