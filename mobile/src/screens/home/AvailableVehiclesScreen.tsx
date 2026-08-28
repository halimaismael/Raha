import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Image } from 'react-native';
import * as Location from 'expo-location';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { Vehicle } from '../../types';

const TYPE_LABELS: Record<string, string> = { BUS: 'Bus', TAXI: 'Taxi', VOITURE: 'Voiture', CAMION: 'Camion' };

export default function AvailableVehiclesScreen({ route, navigation }: any) {
  const { type, purpose, title, ownerType, scheduledDateISO } = route.params || {};
  const [vehicles, setVehicles] = useState<(Vehicle & { distanceKm?: number | null; etaMinutes?: number | null; drivers?: { name: string }[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const params: any = { type, ownerType };
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          params.pickupLat = pos.coords.latitude;
          params.pickupLng = pos.coords.longitude;
        } else {
          setLocationDenied(true);
        }
        const { data } = await api.get('/vehicles/search', { params });
        setVehicles(data);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>
        <Text style={typography.display}>{title || 'Véhicules disponibles'}</Text>
        <Text style={typography.bodyMuted}>
          {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} correspondant{vehicles.length > 1 ? 's' : ''} à votre demande
        </Text>
        {locationDenied && (
          <Text style={styles.locationWarning}>
            Activez la localisation pour voir le temps d'arrivée estimé de chaque véhicule.
          </Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ocean} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('Booking', {
                vehicle: item,
                initialPurpose: purpose,
                initialScheduledDateISO: scheduledDateISO,
              })}
            >
              <View style={styles.cardTop}>
                <View style={styles.thumb}>
                  {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={styles.thumbImg} />
                  ) : (
                    <Text style={{ fontSize: 26 }}>🚗</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h2}>{item.brand} {item.model}</Text>
                  <Text style={typography.bodyMuted}>{item.agency?.name} · {TYPE_LABELS[item.type]}</Text>
                  <View style={styles.tagsRow}>
                    <View style={[styles.tag, item.agency?.type === 'PARTICULIER' ? styles.tagParticulier : styles.tagAgence]}>
                      <Text style={styles.tagText}>{item.agency?.type === 'PARTICULIER' ? 'Particulier' : 'Agence'}</Text>
                    </View>
                    {item.drivers && item.drivers.length > 0 && (
                      <Text style={styles.driverName}>🧑‍✈️ {item.drivers[0].name}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.price}>{item.basePrice.toLocaleString('fr-FR')}{'\n'}KMF</Text>
              </View>

              <View style={styles.footer}>
                {item.etaMinutes != null ? (
                  <View style={styles.etaBadge}>
                    <Text style={styles.etaIcon}>🕐</Text>
                    <Text style={styles.etaText}>
                      Arrive en ~{item.etaMinutes} min {item.distanceKm != null ? `(${item.distanceKm} km)` : ''}
                    </Text>
                  </View>
                ) : (
                  <Text style={typography.caption}>Temps d'arrivée non disponible</Text>
                )}
                <View style={styles.featuresRow}>
                  {item.features?.slice(0, 2).map((f) => (
                    <View key={f} style={styles.featureTag}><Text style={styles.featureText}>{f}</Text></View>
                  ))}
                </View>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={typography.bodyMuted}>Aucun véhicule disponible pour ce type de trajet pour le moment.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  locationWarning: { fontSize: 12, color: colors.ylang, marginTop: 8, fontWeight: '600' },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.line },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  thumbImg: { width: 56, height: 56, borderRadius: radius.md },
  price: { fontSize: 13, fontWeight: '800', color: colors.ocean, textAlign: 'right' },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' },
  tag: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  tagParticulier: { backgroundColor: colors.lavender },
  tagAgence: { backgroundColor: colors.sandDeep },
  tagText: { fontSize: 9, fontWeight: '700', color: colors.charcoal },
  driverName: { fontSize: 10, color: colors.slate, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  etaBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  etaIcon: { fontSize: 13 },
  etaText: { fontSize: 12, fontWeight: '700', color: colors.lagoon },
  featuresRow: { flexDirection: 'row', gap: 6 },
  featureTag: { backgroundColor: colors.sandDeep, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  featureText: { fontSize: 10, fontWeight: '600', color: colors.slate },
});
