import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import * as Location from 'expo-location';
import { colors, radius, typography } from '../../theme/colors';

// Étape entre "Qui vous conduit ?" (ChooseProviderScreen) et la liste des
// véhicules disponibles avec prix (AvailableVehiclesScreen) : l'usager
// indique où il se trouve (manuellement ou via le GPS) et où il va, avant
// de voir les prix.
export default function TripDetailsScreen({ route, navigation }: any) {
  const { purpose, title, ownerType, scheduledDateISO } = route.params || {};

  const [pickupName, setPickupName] = useState('');
  const [destinationName, setDestinationName] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  async function useGPS() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Localisation refusée',
          "Autorisez l'accès à votre position dans les réglages de votre téléphone, ou saisissez votre adresse manuellement."
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setPickupCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (place) {
          const label = [place.name || place.street, place.city || place.subregion].filter(Boolean).join(', ');
          setPickupName(label || 'Ma position actuelle');
        } else {
          setPickupName('Ma position actuelle');
        }
      } catch {
        setPickupName('Ma position actuelle');
      }
    } catch {
      Alert.alert('Erreur', "Impossible de récupérer votre position pour le moment.");
    } finally {
      setLocating(false);
    }
  }

  function seePrices() {
    if (!pickupName.trim()) {
      return Alert.alert('Lieu de prise en charge requis', "Indiquez où le chauffeur doit venir vous chercher (ou utilisez le GPS).");
    }
    navigation.navigate('AvailableVehicles', {
      type: 'VOITURE',
      purpose,
      title: title || 'Voitures disponibles',
      ownerType,
      scheduledDateISO,
      pickupName: pickupName.trim(),
      destinationName: destinationName.trim() || undefined,
      pickupLat: pickupCoords?.lat,
      pickupLng: pickupCoords?.lng,
    });
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>
      <Text style={typography.display}>Où allez-vous ?</Text>
      <Text style={typography.bodyMuted}>Indiquez votre lieu de prise en charge et votre destination.</Text>

      <Text style={styles.label}>Lieu de prise en charge</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Domicile, Moroni centre..."
        value={pickupName}
        onChangeText={(v) => { setPickupName(v); setPickupCoords(null); }}
        placeholderTextColor={colors.slate}
      />
      <Pressable style={styles.gpsBtn} onPress={useGPS} disabled={locating}>
        {locating ? (
          <ActivityIndicator color={colors.ocean} size="small" />
        ) : (
          <Text style={styles.gpsBtnText}>📍 Utiliser ma position actuelle (GPS)</Text>
        )}
      </Pressable>

      <Text style={styles.label}>Destination (optionnel)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Aéroport, Salle des fêtes..."
        value={destinationName}
        onChangeText={setDestinationName}
        placeholderTextColor={colors.slate}
      />

      <Pressable style={styles.pricesBtn} onPress={seePrices}>
        <Text style={styles.pricesBtnText}>Voir les prix</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand, padding: 20, paddingTop: 60 },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  label: { ...typography.caption, marginBottom: 6, marginTop: 22 },
  input: {
    backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.line, fontSize: 15, color: colors.charcoal,
  },
  gpsBtn: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 6 },
  gpsBtnText: { color: colors.ocean, fontWeight: '700', fontSize: 13 },
  pricesBtn: { backgroundColor: colors.coral, borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center', marginTop: 36 },
  pricesBtnText: { ...typography.button, fontSize: 16 },
});
