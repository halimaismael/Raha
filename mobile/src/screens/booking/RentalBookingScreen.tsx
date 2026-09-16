import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { PaymentMethod, Vehicle, VehicleRentalPeriod } from '../../types';

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function daysBetweenInclusive(a: Date, b: Date) {
  const ms = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.round(ms / 86400000) + 1;
}

// Réservation d'une location de voiture : l'usager choisit une date de début
// dans la période proposée par le propriétaire, puis un nombre de jours — le
// backend recalcule et vérifie tout (bornes de la période, jours restants).
export default function RentalBookingScreen({ route, navigation }: any) {
  const { vehicle, period }: { vehicle: Vehicle; period: VehicleRentalPeriod } = route.params;

  const periodStart = useMemo(() => {
    const s = new Date(period.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return s < today ? today : s;
  }, [period]);
  const periodEnd = useMemo(() => new Date(period.endDate), [period]);

  const availableStartDates = useMemo(() => {
    const dates: Date[] = [];
    let d = new Date(periodStart);
    while (d <= periodEnd) {
      dates.push(new Date(d));
      d = addDays(d, 1);
    }
    return dates;
  }, [periodStart, periodEnd]);

  const [startDate, setStartDate] = useState<Date>(availableStartDates[0] || periodStart);
  const maxDaysFromStart = Math.min(period.remainingDays, daysBetweenInclusive(startDate, periodEnd));
  const [daysCount, setDaysCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_BOARD');
  const [submitting, setSubmitting] = useState(false);

  function chooseStart(d: Date) {
    setStartDate(d);
    setDaysCount(1);
  }

  function changeDays(delta: number) {
    setDaysCount((n) => Math.max(1, Math.min(maxDaysFromStart || 1, n + delta)));
  }

  const endDate = addDays(startDate, daysCount - 1);
  const totalPrice = vehicle.basePrice * daysCount;

  async function handleConfirm() {
    if (maxDaysFromStart < 1) {
      return Alert.alert('Plus de jours disponibles', "Il ne reste plus de jour disponible sur cette période à partir de cette date.");
    }
    setSubmitting(true);
    try {
      const { data: booking } = await api.post('/bookings', {
        vehicleId: vehicle.id,
        bookingType: 'CAR_RENTAL',
        rentalPeriodId: period.id,
        scheduledDate: toISODate(startDate),
        scheduledEndDate: toISODate(endDate),
        purpose: 'Location de voiture',
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
      <Text style={typography.display}>Louer ce véhicule</Text>
      <Text style={typography.bodyMuted}>{vehicle.brand} {vehicle.model} · {vehicle.basePrice.toLocaleString('fr-FR')} KMF/jour</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date de début</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {availableStartDates.map((d) => {
            const active = toISODate(d) === toISODate(startDate);
            return (
              <Pressable key={toISODate(d)} style={[styles.datePill, active && styles.datePillActive]} onPress={() => chooseStart(d)}>
                <Text style={[styles.datePillText, active && styles.datePillTextActive]}>
                  {d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Nombre de jours</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.stepperBtn} onPress={() => changeDays(-1)}><Text style={styles.stepperBtnText}>−</Text></Pressable>
          <Text style={styles.stepperValue}>{daysCount}</Text>
          <Pressable style={styles.stepperBtn} onPress={() => changeDays(1)}><Text style={styles.stepperBtnText}>+</Text></Pressable>
        </View>
        <Text style={typography.caption}>
          {maxDaysFromStart} jour{maxDaysFromStart > 1 ? 's' : ''} au maximum à partir de cette date · Jusqu'au {endDate.toLocaleDateString('fr-FR')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Remarques (optionnel)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="Précisez vos besoins particuliers..."
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
        <Text style={typography.bodyMuted}>Total estimé ({daysCount} jour{daysCount > 1 ? 's' : ''})</Text>
        <Text style={styles.total}>{totalPrice.toLocaleString('fr-FR')} KMF</Text>
      </View>

      <Pressable style={styles.confirmBtn} onPress={handleConfirm} disabled={submitting}>
        <Text style={styles.confirmBtnText}>{submitting ? 'Confirmation...' : 'Confirmer la location'}</Text>
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
  datePill: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  datePillActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  datePillText: { fontSize: 13, fontWeight: '700', color: colors.charcoal },
  datePillTextActive: { color: colors.white },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 6 },
  stepperBtn: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  stepperBtnText: { fontSize: 20, fontWeight: '800', color: colors.ocean },
  stepperValue: { fontSize: 20, fontWeight: '800', color: colors.charcoal, minWidth: 30, textAlign: 'center' },
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
