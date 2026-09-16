import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Image } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { Vehicle, VehicleRentalPeriod } from '../../types';

type RentalVehicle = Vehicle & { rentalPeriods: VehicleRentalPeriod[] };

export default function RentalVehicleListScreen({ route, navigation }: any) {
  const { ownerType, type, brand } = route.params || {};
  const [vehicles, setVehicles] = useState<RentalVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/vehicles/rental-search', { params: { ownerType, type, brand } });
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
        <Text style={typography.display}>Véhicules à louer</Text>
        <Text style={typography.bodyMuted}>
          {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} disponible{vehicles.length > 1 ? 's' : ''} à la location
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ocean} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
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
                  <Text style={typography.bodyMuted}>
                    {item.agency?.name || (item.independentDriver ? `${item.independentDriver.firstName} ${item.independentDriver.lastName}` : 'Particulier')}
                  </Text>
                  <View style={styles.tagsRow}>
                    <View style={[styles.tag, !item.agency ? styles.tagParticulier : styles.tagAgence]}>
                      <Text style={styles.tagText}>{!item.agency ? 'Particulier' : 'Agence'}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.price}>{item.basePrice.toLocaleString('fr-FR')}{'\n'}KMF/jour</Text>
              </View>

              <View style={styles.periodsBlock}>
                {item.rentalPeriods.map((p) => (
                  <Pressable
                    key={p.id}
                    style={styles.periodRow}
                    onPress={() => navigation.navigate('RentalBooking', { vehicle: item, period: p })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.periodDates}>
                        Du {new Date(p.startDate).toLocaleDateString('fr-FR')} au {new Date(p.endDate).toLocaleDateString('fr-FR')}
                      </Text>
                      <Text style={styles.periodRemaining}>{p.remainingDays} jour{p.remainingDays > 1 ? 's' : ''} restant{p.remainingDays > 1 ? 's' : ''}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={typography.bodyMuted}>Aucun véhicule disponible à la location pour ces critères.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.line },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  thumbImg: { width: 56, height: 56, borderRadius: radius.md },
  price: { fontSize: 12, fontWeight: '800', color: colors.ocean, textAlign: 'right' },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  tag: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  tagParticulier: { backgroundColor: colors.lavender },
  tagAgence: { backgroundColor: colors.sandDeep },
  tagText: { fontSize: 9, fontWeight: '700', color: colors.charcoal },
  periodsBlock: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line, gap: 8 },
  periodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.sand, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10 },
  periodDates: { fontSize: 12.5, fontWeight: '700', color: colors.charcoal },
  periodRemaining: { fontSize: 11, fontWeight: '600', color: colors.lagoon, marginTop: 2 },
  chevron: { fontSize: 20, color: colors.slate },
});
