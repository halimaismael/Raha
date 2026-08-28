import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, radius, typography } from '../../theme/colors';
import { getSocket, joinTripRoom, leaveTripRoom } from '../../services/socket';
import { api } from '../../services/api';
import { Booking } from '../../types';

// Centre par défaut : Grande Comore (Ngazidja)
const GRANDE_COMORE_REGION = {
  latitude: -11.65,
  longitude: 43.33,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export default function TripTrackingScreen({ route }: any) {
  const { booking }: { booking: Booking } = route.params;
  const trip = booking.trip;
  const mapRef = useRef<MapView>(null);

  const [vehiclePosition, setVehiclePosition] = useState<{ lat: number; lng: number } | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (!trip) return;
    joinTripRoom(trip.id);

    // Récupère la dernière position connue au chargement
    api.get(`/tracking/${trip.id}/last`).then(({ data }) => {
      if (data) setVehiclePosition({ lat: data.lat, lng: data.lng });
    }).catch(() => {});

    const socket = getSocket();
    const onLocationUpdate = (ping: { lat: number; lng: number }) => {
      setVehiclePosition({ lat: ping.lat, lng: ping.lng });
    };
    socket.on('location:update', onLocationUpdate);

    return () => {
      leaveTripRoom(trip.id);
      socket.off('location:update', onLocationUpdate);
    };
  }, [trip?.id]);

  const origin = trip ? { latitude: trip.originLat, longitude: trip.originLng } : null;
  const destination = trip ? { latitude: trip.destinationLat, longitude: trip.destinationLng } : null;

  const initialRegion = origin
    ? { latitude: origin.latitude, longitude: origin.longitude, latitudeDelta: 0.15, longitudeDelta: 0.15 }
    : GRANDE_COMORE_REGION;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
      >
        {origin && <Marker coordinate={origin} title="Départ" pinColor={colors.coral} />}
        {destination && <Marker coordinate={destination} title="Arrivée" pinColor={colors.ocean} />}
        {origin && destination && (
          <Polyline coordinates={[origin, destination]} strokeColor={colors.lagoon} strokeWidth={4} lineDashPattern={[8, 6]} />
        )}
        {vehiclePosition && (
          <Marker coordinate={{ latitude: vehiclePosition.lat, longitude: vehiclePosition.lng }} title="Votre véhicule" >
            <View style={styles.vehicleMarker}>
              <Text style={{ fontSize: 18 }}>🚐</Text>
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.topCard}>
        <View style={styles.statusRow}>
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>
            {vehiclePosition ? 'Véhicule en approche — suivi en direct' : 'En attente de la position du véhicule...'}
          </Text>
        </View>
        <Text style={typography.h2}>{booking.agency.name}</Text>
        <Text style={typography.bodyMuted}>
          {trip ? `${trip.originName} → ${trip.destinationName}` : 'Course privée'}
        </Text>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.driverRow}>
          <View style={styles.driverAvatar}><Text style={{ fontSize: 22 }}>👤</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={typography.h2}>{booking.vehicle.brand} {booking.vehicle.model}</Text>
            <Text style={typography.bodyMuted}>Réf. réservation : {booking.reference}</Text>
          </View>
          <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${booking.agency.phone}`)}>
            <Text style={styles.callBtnText}>📞</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  topCard: {
    position: 'absolute', top: 55, left: 16, right: 16, backgroundColor: colors.white,
    borderRadius: radius.lg, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '700', color: colors.success },
  bottomCard: { position: 'absolute', bottom: 30, left: 16, right: 16, backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  driverRow: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lagoon, alignItems: 'center', justifyContent: 'center' },
  callBtnText: { fontSize: 18 },
  vehicleMarker: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.coral },
});
