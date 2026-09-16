import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Booking, BookingStatus } from '../../types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Nouvelle demande',
  ACCEPTED: 'Acceptée',
  CONFIRMED: 'Confirmée',
  DRIVER_ASSIGNED: 'À accepter',
  DRIVER_ARRIVING: 'En route',
  DRIVER_ARRIVED: 'Arrivé sur place',
  TRIP_STARTED: 'Trajet en cours',
  COMPLETED: 'Terminée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée',
  EXPIRED: 'Expirée',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: colors.ylang,
  DRIVER_ASSIGNED: colors.ylang,
  CONFIRMED: colors.lagoon,
  ACCEPTED: colors.lagoon,
  DRIVER_ARRIVING: colors.ocean,
  DRIVER_ARRIVED: colors.ocean,
  TRIP_STARTED: colors.ocean,
  COMPLETED: colors.success,
  REJECTED: colors.danger,
  CANCELLED: colors.danger,
  EXPIRED: colors.danger,
};

const NEXT_STATUS_ACTION: Partial<Record<BookingStatus, { next: BookingStatus; label: string }>> = {
  CONFIRMED: { next: 'DRIVER_ARRIVING', label: 'Je suis en route' },
  DRIVER_ARRIVING: { next: 'DRIVER_ARRIVED', label: 'Je suis arrivé' },
  DRIVER_ARRIVED: { next: 'TRIP_STARTED', label: 'Démarrer le trajet' },
  TRIP_STARTED: { next: 'COMPLETED', label: 'Terminer le trajet' },
};
const CANCELLABLE: BookingStatus[] = ['CONFIRMED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED'];

const FILTERS = [
  { key: 'ACTIVE', label: 'À traiter' },
  { key: 'ONGOING', label: 'En cours' },
  { key: 'DONE', label: 'Terminées' },
  { key: 'ALL', label: 'Toutes' },
];

export default function ProBookingsScreen() {
  const { role } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState('ACTIVE');

  const load = useCallback(() => {
    setLoading(true);
    return api.get('/bookings/professional/mine')
      .then(({ data }) => setBookings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    if (filter === 'ALL') return bookings;
    if (filter === 'ACTIVE') return bookings.filter((b) => ['PENDING', 'DRIVER_ASSIGNED'].includes(b.status));
    if (filter === 'ONGOING') return bookings.filter((b) => ['CONFIRMED', 'DRIVER_ARRIVING', 'DRIVER_ARRIVED', 'TRIP_STARTED'].includes(b.status));
    if (filter === 'DONE') return bookings.filter((b) => ['COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(b.status));
    return bookings;
  }, [bookings, filter]);

  async function act(id: string, action: 'accept' | 'reject' | 'status', payload?: any) {
    setBusyId(id);
    try {
      if (action === 'accept') await api.patch(`/bookings/${id}/accept`);
      else if (action === 'reject') await api.patch(`/bookings/${id}/reject`);
      else await api.patch(`/bookings/${id}/status`, payload);
      await load();
    } catch (err: any) {
      Alert.alert('Action impossible', err?.response?.data?.message || 'Réessayez.');
    } finally {
      setBusyId(null);
    }
  }

  function confirmReject(id: string) {
    Alert.alert('Refuser cette course ?', 'L\'usager sera informé et pourra choisir un autre véhicule.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Refuser', style: 'destructive', onPress: () => act(id, 'reject') },
    ]);
  }

  function confirmCancel(id: string) {
    Alert.alert('Annuler cette réservation ?', 'Cette action est irréversible.', [
      { text: 'Retour', style: 'cancel' },
      { text: 'Annuler la course', style: 'destructive', onPress: () => act(id, 'status', { status: 'CANCELLED' }) },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.display}>Mes courses</Text>
        <Text style={typography.bodyMuted}>{role === 'INDEPENDENT_DRIVER' ? 'Chauffeur indépendant' : 'Chauffeur d\'agence'}</Text>
      </View>

      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} style={[styles.filterPill, filter === f.key && styles.filterPillActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ocean} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          onRefresh={load}
          refreshing={loading}
          ListEmptyComponent={<Text style={typography.bodyMuted}>Aucune course dans cette catégorie.</Text>}
          renderItem={({ item }) => {
            const isBusy = busyId === item.id;
            const canAcceptReject = ['PENDING', 'DRIVER_ASSIGNED'].includes(item.status);
            const nextAction = NEXT_STATUS_ACTION[item.status];
            const canCancel = CANCELLABLE.includes(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
                    <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] }]}>{STATUS_LABELS[item.status]}</Text>
                  </View>
                  <Text style={styles.reference}>{item.reference}</Text>
                </View>

                <Text style={typography.h2}>{item.vehicle?.brand} {item.vehicle?.model}</Text>
                <Text style={styles.clientName}>👤 {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'Client Raha'}</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📅</Text>
                  <Text style={styles.infoText}>
                    {new Date(item.scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} · {new Date(item.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {!!item.pickupName && (
                  <View style={styles.infoRow}><Text style={styles.infoIcon}>📍</Text><Text style={styles.infoText}>{item.pickupName}</Text></View>
                )}
                {!!item.dropoffName && (
                  <View style={styles.infoRow}><Text style={styles.infoIcon}>🏁</Text><Text style={styles.infoText}>{item.dropoffName}</Text></View>
                )}
                {!!item.user?.phone && (
                  <Pressable style={styles.infoRow} onPress={() => Linking.openURL(`tel:${item.user!.phone}`)}>
                    <Text style={styles.infoIcon}>📞</Text>
                    <Text style={[styles.infoText, { color: colors.ocean, fontWeight: '700' }]}>{item.user.phone}</Text>
                  </Pressable>
                )}
                {!!item.driverMessage && (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageBoxLabel}>💬 Message du client</Text>
                    <Text style={styles.messageBoxText}>{item.driverMessage}</Text>
                  </View>
                )}

                <View style={styles.footer}>
                  <Text style={styles.price}>{item.totalPrice?.toLocaleString('fr-FR')} KMF</Text>
                </View>

                {canAcceptReject && (
                  <View style={styles.actionsRow}>
                    <Pressable style={[styles.actionBtn, styles.rejectBtn]} disabled={isBusy} onPress={() => confirmReject(item.id)}>
                      <Text style={styles.rejectBtnText}>Refuser</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, styles.acceptBtn]} disabled={isBusy} onPress={() => act(item.id, 'accept')}>
                      <Text style={styles.acceptBtnText}>{isBusy ? '...' : 'Accepter'}</Text>
                    </Pressable>
                  </View>
                )}

                {!canAcceptReject && nextAction && (
                  <View style={styles.actionsRow}>
                    {canCancel && (
                      <Pressable style={[styles.actionBtn, styles.rejectBtn]} disabled={isBusy} onPress={() => confirmCancel(item.id)}>
                        <Text style={styles.rejectBtnText}>Annuler</Text>
                      </Pressable>
                    )}
                    <Pressable style={[styles.actionBtn, styles.acceptBtn]} disabled={isBusy} onPress={() => act(item.id, 'status', { status: nextAction.next })}>
                      <Text style={styles.acceptBtnText}>{isBusy ? '...' : nextAction.label}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8, paddingBottom: 6 },
  filterPill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, marginBottom: 8 },
  filterPillActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.charcoal },
  filterTextActive: { color: colors.white },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.line },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },
  reference: { fontSize: 11, fontWeight: '700', color: colors.slate },
  clientName: { fontSize: 12.5, color: colors.slate, fontWeight: '600', marginTop: 4, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoIcon: { fontSize: 12 },
  infoText: { fontSize: 12.5, color: colors.slate, fontWeight: '600' },
  messageBox: { backgroundColor: colors.sandDeep, borderRadius: radius.md, padding: 10, marginTop: 8 },
  messageBoxLabel: { fontSize: 10.5, fontWeight: '800', color: colors.slate, marginBottom: 3 },
  messageBoxText: { fontSize: 12.5, color: colors.charcoal, lineHeight: 17 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
  price: { fontWeight: '800', color: colors.ocean, fontSize: 16 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' },
  acceptBtn: { backgroundColor: colors.ocean },
  acceptBtnText: { color: colors.white, fontWeight: '700', fontSize: 13.5 },
  rejectBtn: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.danger },
  rejectBtnText: { color: colors.danger, fontWeight: '700', fontSize: 13.5 },
});
