import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { Booking } from '../../types';

export default function PaymentScreen({ route, navigation }: any) {
  const { booking }: { booking: Booking } = route.params;
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(booking.paymentMethod === 'CASH_ON_BOARD');

  async function handlePay() {
    if (!phone) return Alert.alert('Numéro requis', 'Entrez le numéro Mobile Money à débiter.');
    setLoading(true);
    try {
      await api.post(`/payments/${booking.id}/mobile-money/initiate`, { phoneNumber: phone, provider: 'HolluPay' });
      setDone(true);
    } catch (err: any) {
      Alert.alert('Paiement impossible', err?.response?.data?.message || 'Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <View style={styles.container}>
        <View style={styles.successBox}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={typography.display}>Réservation confirmée</Text>
          <Text style={[typography.bodyMuted, { textAlign: 'center', marginTop: 8 }]}>
            Référence : {booking.reference}
            {booking.paymentMethod === 'MOBILE_MONEY'
              ? "\nValidez la transaction reçue sur votre téléphone."
              : "\nVous réglerez directement au chauffeur / à l'agence."}
          </Text>
        </View>
        <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('MyBookings')}>
          <Text style={styles.primaryBtnText}>Voir mes réservations</Text>
        </Pressable>
        <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.secondaryBtnText}>Retour à l'accueil</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={typography.display}>Paiement Mobile Money</Text>
      <Text style={[typography.bodyMuted, { marginTop: 6, marginBottom: 30 }]}>
        Montant à payer : {booking.totalPrice.toLocaleString('fr-FR')} KMF
      </Text>

      <Text style={styles.label}>Numéro Mobile Money</Text>
      <TextInput
        style={styles.input}
        placeholder="+269 3XX XX XX"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        placeholderTextColor={colors.slate}
      />

      <Pressable style={styles.primaryBtn} onPress={handlePay} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Payer maintenant</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand, padding: 24, paddingTop: 90, justifyContent: 'flex-start' },
  label: { ...typography.caption, marginBottom: 8 },
  input: { backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: colors.line, fontSize: 15, color: colors.charcoal },
  primaryBtn: { backgroundColor: colors.ocean, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  primaryBtnText: { ...typography.button },
  secondaryBtn: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: colors.slate },
  successBox: { alignItems: 'center', marginTop: 60, marginBottom: 40 },
  successEmoji: { fontSize: 56, marginBottom: 16 },
});
