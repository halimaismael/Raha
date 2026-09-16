import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, TextInput, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { DriverPricing, PricingKind } from '../../types';

const KINDS: { key: PricingKind; label: string }[] = [
  { key: 'MINIMUM', label: 'Tarif minimum' },
  { key: 'PER_TRIP', label: 'Par trajet' },
  { key: 'PER_KM', label: 'Par km' },
  { key: 'FULL_DAY', label: 'Journée complète' },
  { key: 'AIRPORT', label: 'Aéroport' },
  { key: 'HOURLY', label: 'Par heure' },
  { key: 'CUSTOM', label: 'Autre' },
];

export default function ProPricingScreen() {
  const [rules, setRules] = useState<DriverPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [kind, setKind] = useState<PricingKind>('PER_TRIP');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    return api.get('/independent-drivers/me/pricing').then(({ data }) => setRules(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function openCreate() {
    setKind('PER_TRIP'); setAmount(''); setLabel('');
    setModalOpen(true);
  }

  async function save() {
    if (!amount) return Alert.alert('Montant requis', 'Indiquez un montant en KMF.');
    setSaving(true);
    try {
      await api.post('/independent-drivers/me/pricing', { kind, amount: Number(amount), label: label || undefined });
      setModalOpen(false);
      await load();
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Impossible d\'enregistrer ce tarif.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(id: string) {
    Alert.alert('Supprimer ce tarif ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await api.delete(`/independent-drivers/me/pricing/${id}`); load(); } },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.display}>Mes tarifs</Text>
        <Pressable style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>Ces tarifs sont visibles par les usagers avant qu'ils ne vous réservent.</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ocean} />
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={typography.bodyMuted}>Aucun tarif personnalisé pour le moment.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={typography.h2}>{item.label || KINDS.find((k) => k.key === item.kind)?.label}</Text>
                <Text style={styles.kindTag}>{KINDS.find((k) => k.key === item.kind)?.label}</Text>
              </View>
              <Text style={styles.amount}>{item.amount.toLocaleString('fr-FR')} KMF</Text>
              <Pressable style={styles.deleteBtn} onPress={() => confirmDelete(item.id)}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={typography.h1}>Nouveau tarif</Text>

            <Text style={styles.label}>Type de tarif</Text>
            <View style={styles.typeGrid}>
              {KINDS.map((k) => (
                <Pressable key={k.key} style={[styles.typePill, kind === k.key && styles.typePillActive]} onPress={() => setKind(k.key)}>
                  <Text style={[styles.typePillText, kind === k.key && styles.typePillTextActive]}>{k.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Nom (optionnel)</Text>
            <TextInput style={styles.input} value={label} onChangeText={setLabel} placeholder="Ex : Trajet Moroni - Aéroport" placeholderTextColor={colors.slate} />

            <Text style={styles.label}>Montant (KMF)</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="10000" placeholderTextColor={colors.slate} />

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalOpen(false)}><Text style={styles.cancelBtnText}>Annuler</Text></Pressable>
              <Pressable style={styles.saveBtn} onPress={save} disabled={saving}><Text style={styles.saveBtnText}>{saving ? '...' : 'Enregistrer'}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: { paddingHorizontal: 20, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtitle: { ...typography.bodyMuted, paddingHorizontal: 20, paddingTop: 6 },
  addBtn: { backgroundColor: colors.ocean, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 12.5 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.line },
  kindTag: { fontSize: 11, color: colors.slate, marginTop: 3 },
  amount: { fontWeight: '800', color: colors.ocean, fontSize: 14, marginRight: 10 },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: colors.danger, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.sand, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 },
  label: { ...typography.caption, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: colors.line, fontSize: 14, color: colors.charcoal },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typePill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  typePillActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  typePillText: { fontSize: 11.5, fontWeight: '700', color: colors.charcoal },
  typePillTextActive: { color: colors.white },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 10 },
  cancelBtn: { flex: 1, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: colors.line },
  cancelBtnText: { fontWeight: '700', color: colors.charcoal },
  saveBtn: { flex: 1, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.ocean },
  saveBtnText: { fontWeight: '700', color: colors.white },
});
