import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { colors, typography } from '../../theme/colors';
import AgencyCard from '../../components/AgencyCard';
import { api } from '../../services/api';
import { Agency } from '../../types';

export default function AgencyListScreen({ route, navigation }: any) {
  const { type, purpose } = route.params || {};
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/agencies');
        setAgencies(data);
      } catch (e) {
        console.warn('Erreur chargement agences', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>
        <Text style={typography.display}>Agences</Text>
        <Text style={typography.bodyMuted}>{agencies.length} agences disponibles en Grande Comore</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ocean} />
      ) : (
        <FlatList
          data={agencies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <AgencyCard agency={item} onPress={() => navigation.navigate('VehicleList', { agencyId: item.id, agencyName: item.name, type, purpose })} />
          )}
          ListEmptyComponent={<Text style={typography.bodyMuted}>Aucune agence disponible pour le moment.</Text>}
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
