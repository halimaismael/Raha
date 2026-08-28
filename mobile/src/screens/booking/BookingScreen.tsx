import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { BookingType, PaymentMethod, SeatPreference, Trip, Vehicle } from '../../types';

const SEAT_OPTIONS: { key: SeatPreference; label: string }[] = [
  { key: 'FENETRE', label: 'Côté fenêtre' },
  { key: 'COULOIR', label: 'Côté couloir' },
  { key: 'PEU_IMPORTE', label: 'Peu importe' },
];

const MOTIFS = ['Déplacement personnel', 'Mariage / cérémonie', 'Déménagement', 'Course en ville', 'Voyage professionnel', 'Autre'];

export default function BookingScreen({ route, navigation }: any) {
  const { vehicle, trip, initialPurpose, initialScheduledDateISO }: { vehicle: Vehicle; trip?: Trip; initialPurpose?: string; initialScheduledDateISO?: string } = route.params;

  const bookingType: BookingType = trip ? 'SHARED_SEAT' : vehicle.type === 'CAMION' ? 'CARGO_MOVING' : 'PRIVATE_FULL_DAY';

  const [seatPreference, setSeatPreference] = useState<SeatPreference>('PEU_IMPORTE');
  const [passengersCount, setPassengersCount] = useState('1');
  const [purpose, setPurpose] = useState(initialPurpose && MOTIFS.includes(initialPurpose) ? initialPurpose : (initialPurpose || MOTIFS[0]));
  const [notes, setNotes] = useState('');
  const [pickupName, setPickupName] = useState('');
  const [dropoffName, setDropoffName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_BOARD');
  const [submitting, setSubmitting] = useState(false);

  const scheduledDate = trip ? trip.departureTime : (initialScheduledDateISO || new Date(Date.now() + 3600 * 1000).toISOString());

  const estimatedPrice = useMemo(() => {
    if (bookingType === 'SHARED_SEAT' && trip) return trip.pricePerSeat * Number(passengersCount || '1');
    return vehicle.basePrice;
  }, [bookingType, trip, passengersCount, vehicle]);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const { data: booking } = await api.post('/bookings', {
        vehicleId: vehicle.id,
        tripId: trip?.id,
        bookingType,
        scheduledDate,
        seatPreference,
        passengersCount: Number(passengersCount || '1'),
        pickupName: pickupName || undefined,
        dropoffName: dropoffName || undefined,
        purpose,
        notes,
        paymentMethod,
      });
      navigation.navigate('Payment', { booking });
    } catch (err: any) {
      Alert.alert('Réservation impossible', err?.response?.data?.message || 'Réessayez dans un instant.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 60 }}>
      <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>
      <Text style={typography.display}>Réserver</Text>
      <Text style={typography.bodyMuted}>{vehicle.brand} {vehicle.model}{trip ? ` · ${trip.originName} → ${trip.destinationName}` : ''}</Text>

      {bookingType === 'SHARED_SEAT' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférence de siège</Text>
          <View style={styles.row}>
            {SEAT_OPTIONS.map((opt) => (
              <Pressable key={opt.key} style={[styles.pill, seatPreference === opt.key && styles.pillActive]} onPress={() => setSeatPreference(opt.key)}>
                <Text style={[styles.pillText, seatPreference === opt.key && styles.pillTextActive]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Nombre de passagers</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={passengersCount} onChangeText={setPassengersCount} />

          <Text style={styles.sectionTitle}>Point de prise en charge</Text>
          <TextInput style={styles.input} placeholder="Ex: Devant la mosquée, arrêt principal..." value={pickupName} onChangeText={setPickupName} placeholderTextColor={colors.slate} />
        </View>
      )}

      {bookingType === 'PRIVATE_FULL_DAY' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lieu de prise en charge</Text>
          <TextInput style={styles.input} placeholder="Ex: Domicile, Moroni centre..." value={pickupName} onChangeText={setPickupName} placeholderTextColor={colors.slate} />
          <Text style={styles.sectionTitle}>Destination principale</Text>
          <TextInput style={styles.input} placeholder="Ex: Salle des fêtes Volo Volo" value={dropoffName} onChangeText={setDropoffName} placeholderTextColor={colors.slate} />
        </View>
      )}

      {bookingType === 'CARGO_MOVING' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Point de départ</Text>
          <TextInput style={styles.input} placeholder="Adresse de chargement" value={pickupName} onChangeText={setPickupName} placeholderTextColor={colors.slate} />
          <Text style={styles.sectionTitle}>Point d'arrivée</Text>
          <TextInput style={styles.input} placeholder="Adresse de livraison" value={dropoffName} onChangeText={setDropoffName} placeholderTextColor={colors.slate} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Motif du déplacement</Text>
        <View style={styles.wrapRow}>
          {MOTIFS.map((m) => (
            <Pressable key={m} style={[styles.pill, purpose === m && styles.pillActive]} onPress={() => setPurpose(m)}>
              <Text style={[styles.pillText, purpose === m && styles.pillTextActive]}>{m}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Remarques (optionnel)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Précisez vos besoins : bagages, nombre de meubles, etc."
          multiline
          value={notes}
          onChangeText={setNotes}
          placeholderTextColor={colors.slate}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mode de paiement</Text>
        <View style={styles.row}>
          <Pressable style={[styles.paymentOpt, paymentMethod === 'MOBILE_MONEY' && styles.paymentOptActive]} onPress={() => setPaymentMethod('MOBILE_MONEY')}>
            <Text style={styles.paymentEmoji}>📱</Text>
            <Text style={styles.paymentLabel}>Mobile Money</Text>
          </Pressable>
          <Pressable style={[styles.paymentOpt, paymentMethod === 'CASH_ON_BOARD' && styles.paymentOptActive]} onPress={() => setPaymentMethod('CASH_ON_BOARD')}>
            <Text style={styles.paymentEmoji}>💵</Text>
            <Text style={styles.paymentLabel}>Payer sur place</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={typography.bodyMuted}>Total estimé</Text>
        <Text style={styles.total}>{estimatedPrice.toLocaleString('fr-FR')} KMF</Text>
      </View>

      <Pressable style={styles.confirmBtn} onPress={handleConfirm} disabled={submitting}>
        <Text style={styles.confirmBtnText}>{submitting ? 'Confirmation...' : 'Confirmer la réservation'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  section: { marginTop: 24 },
  sectionTitle: { ...typography.h2, fontSize: 15, marginBottom: 10, marginTop: 14 },
  row: { flexDirection: 'row', gap: 10 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  pillActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.charcoal },
  pillTextActive: { color: colors.white },
  input: { backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.line, fontSize: 14, color: colors.charcoal },
  paymentOpt: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: colors.line },
  paymentOptActive: { borderColor: colors.coral, backgroundColor: '#FFF3ED' },
  paymentEmoji: { fontSize: 26, marginBottom: 6 },
  paymentLabel: { fontSize: 13, fontWeight: '700', color: colors.charcoal },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, backgroundColor: colors.white, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  total: { fontSize: 20, fontWeight: '800', color: colors.ocean },
  confirmBtn: { backgroundColor: colors.coral, borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center', marginTop: 20 },
  confirmBtnText: { ...typography.button, fontSize: 16 },
});
