import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { colors, typography } from '../../theme/colors';
import TripCard from '../../components/TripCard';
import { api } from '../../services/api';
import { Trip } from '../../types';

export default function TripSearchScreen({ route, navigation }: any) {
  const { type, origin, destination } = route.params || {};
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/trips/search', { params: { type, origin, destination } });
        setTrips(data);
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
        <Text style={typography.display}>Trajets disponibles</Text>
        <Text style={typography.bodyMuted}>
          {origin || 'Départ'} → {destination || 'Toutes destinations'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ocean} />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <TripCard trip={item} onPress={() => navigation.navigate('Booking', { vehicle: item.vehicle, trip: item })} />
          )}
          ListEmptyComponent={
            <Text style={typography.bodyMuted}>
              Aucun trajet trouvé. Essayez une autre date ou consultez directement une agence.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
});
