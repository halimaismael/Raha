import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Image } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { Vehicle } from '../../types';

const TYPE_LABELS: Record<string, string> = { BUS: 'Bus', TAXI: 'Taxi', VOITURE: 'Voiture', CAMION: 'Camion' };
const TYPE_ICONS: Record<string, string> = { BUS: '🚌', TAXI: '🚕', VOITURE: '🚗', CAMION: '🚚' };

export default function VehicleListScreen({ route, navigation }: any) {
  const { agencyId, agencyName, type, purpose } = route.params || {};
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/vehicles/search', { params: { type } });
        setVehicles(agencyId ? data.filter((v: Vehicle) => v.agencyId === agencyId) : data);
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
        <Text style={typography.display}>{agencyName || 'Véhicules'}</Text>
        <Text style={typography.bodyMuted}>Choisissez un véhicule à réserver</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ocean} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('Booking', { vehicle: item, initialPurpose: purpose })}>
              <View style={styles.thumb}>
                {item.photoUrl ? <Image source={{ uri: item.photoUrl }} style={styles.thumbImg} /> : <Text style={{ fontSize: 30 }}>{TYPE_ICONS[item.type]}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.h2}>{item.brand} {item.model}</Text>
                <Text style={typography.bodyMuted}>{TYPE_LABELS[item.type]} · {item.seatCapacity} places</Text>
                <View style={styles.featuresRow}>
                  {item.features?.slice(0, 3).map((f) => (
                    <View key={f} style={styles.featureTag}><Text style={styles.featureText}>{f}</Text></View>
                  ))}
                </View>
              </View>
              <Text style={styles.price}>{item.basePrice.toLocaleString('fr-FR')}{'\n'}KMF</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={typography.bodyMuted}>Aucun véhicule disponible pour ce filtre.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.line },
  thumb: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  thumbImg: { width: 60, height: 60, borderRadius: radius.md },
  featuresRow: { flexDirection: 'row', marginTop: 6, gap: 6 },
  featureTag: { backgroundColor: colors.sandDeep, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  featureText: { fontSize: 10, fontWeight: '600', color: colors.slate },
  price: { fontSize: 13, fontWeight: '800', color: colors.ocean, textAlign: 'right' },
});
