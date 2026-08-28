import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { Agency } from '../../types';

const GRANDE_COMORE_REGION = {
  latitude: -11.65,
  longitude: 43.33,
  latitudeDelta: 0.55,
  longitudeDelta: 0.55,
};

export default function MapExploreScreen({ navigation }: any) {
  const [agencies, setAgencies] = useState<Agency[]>([]);

  useEffect(() => {
    api.get('/agencies').then(({ data }) => setAgencies(data)).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <MapView style={StyleSheet.absoluteFillObject} initialRegion={GRANDE_COMORE_REGION}>
        {/* Repères des villes principales de Grande Comore, à défaut de géolocalisation précise par agence */}
        <Marker coordinate={{ latitude: -11.7042, longitude: 43.2402 }} title="Moroni" pinColor={colors.ocean} />
        <Marker coordinate={{ latitude: -11.3833, longitude: 43.2833 }} title="Mitsamiouli" pinColor={colors.lagoon} />
        <Marker coordinate={{ latitude: -11.8833, longitude: 43.6167 }} title="Foumbouni" pinColor={colors.lagoon} />
        <Marker coordinate={{ latitude: -11.75, longitude: 43.35 }} title="Aéroport de Moroni" pinColor={colors.coral} />
      </MapView>

      <Pressable style={styles.back} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹ Retour</Text>
      </Pressable>

      <View style={styles.bottomSheet}>
        <Text style={typography.h2}>{agencies.length} agences en Grande Comore</Text>
        <Text style={typography.bodyMuted}>Choisissez une ville ou une agence pour réserver un trajet.</Text>
        <Pressable style={styles.cta} onPress={() => navigation.navigate('AgencyList', {})}>
          <Text style={styles.ctaText}>Parcourir les agences</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  back: { position: 'absolute', top: 55, left: 16, backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  backText: { fontWeight: '700', color: colors.charcoal },
  bottomSheet: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 14, elevation: 4 },
  cta: { backgroundColor: colors.ocean, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  ctaText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
