import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radius, typography } from '../theme/colors';
import { Trip } from '../types';

export default function TripCard({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const dep = new Date(trip.departureTime);
  const time = dep.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const date = dep.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
  const seatsLeft = trip.totalSeats - trip.bookedSeats;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.rowBetween}>
        <Text style={styles.agencyName}>{trip.agency.name}</Text>
        <Text style={styles.price}>{trip.pricePerSeat.toLocaleString('fr-FR')} KMF</Text>
      </View>

      <View style={styles.routeRow}>
        <View style={styles.routeCol}>
          <View style={styles.dotOrigin} />
          <View style={styles.dashLine} />
          <View style={styles.dotDest} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.place}>{trip.originName}</Text>
          <Text style={[styles.place, { marginTop: 18 }]}>{trip.destinationName}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={typography.caption}>{date} · {time}</Text>
        <Text style={[typography.caption, seatsLeft <= 3 && { color: colors.danger, fontWeight: '700' }]}>
          {seatsLeft > 0 ? `${seatsLeft} places restantes` : 'Complet'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.line },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  agencyName: { fontSize: 13, fontWeight: '700', color: colors.lagoon, textTransform: 'uppercase' },
  price: { fontSize: 16, fontWeight: '800', color: colors.ocean },
  routeRow: { flexDirection: 'row' },
  routeCol: { alignItems: 'center', width: 20, marginRight: 10 },
  dotOrigin: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.coral },
  dashLine: { width: 2, height: 20, backgroundColor: colors.line, marginVertical: 2 },
  dotDest: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ocean },
  place: { fontSize: 15, fontWeight: '600', color: colors.charcoal },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
});
