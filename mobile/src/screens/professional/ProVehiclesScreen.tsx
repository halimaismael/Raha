import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, TextInput, Alert, Modal, ScrollView, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { Vehicle, VehicleType, VehicleRentalPeriod } from '../../types';
import { pickPhotoFromDevice } from '../../utils/imagePicker';

const VEHICLE_TYPES: VehicleType[] = ['VOITURE', 'TAXI', 'BUS', 'CAMION'];

const EMPTY_FORM = {
  type: 'VOITURE' as VehicleType,
  brand: '', model: '', plateNumber: '', seatCapacity: '4', basePrice: '', pricePerKm: '', photoUrl: '',
};

const EMPTY_PERIOD_FORM = { startDate: '', endDate: '' };

function isValidDate(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v).getTime());
}

export default function ProVehiclesScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);

  // Location de voiture : mise en location par période, pour le véhicule
  // actuellement ouvert dans le modal "Location".
  const [rentalVehicle, setRentalVehicle] = useState<Vehicle | null>(null);
  const [rentalPeriods, setRentalPeriods] = useState<VehicleRentalPeriod[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [periodForm, setPeriodForm] = useState(EMPTY_PERIOD_FORM);
  const [savingPeriod, setSavingPeriod] = useState(false);

  function openRental(v: Vehicle) {
    setRentalVehicle(v);
    setPeriodForm(EMPTY_PERIOD_FORM);
    loadPeriods(v.id);
  }

  function loadPeriods(vehicleId: string) {
    setLoadingPeriods(true);
    return api.get(`/vehicles/${vehicleId}/rental-periods`)
      .then(({ data }) => setRentalPeriods(data))
      .catch(() => {})
      .finally(() => setLoadingPeriods(false));
  }

  async function addPeriod() {
    if (!rentalVehicle) return;
    if (!isValidDate(periodForm.startDate) || !isValidDate(periodForm.endDate)) {
      return Alert.alert('Dates invalides', 'Utilisez le format AAAA-MM-JJ, ex : 2026-09-01.');
    }
    if (new Date(periodForm.endDate) < new Date(periodForm.startDate)) {
      return Alert.alert('Dates invalides', 'La date de fin doit être après la date de début.');
    }
    setSavingPeriod(true);
    try {
      await api.post(`/vehicles/${rentalVehicle.id}/rental-periods`, periodForm);
      setPeriodForm(EMPTY_PERIOD_FORM);
      await loadPeriods(rentalVehicle.id);
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message || "Impossible d'ajouter cette période.");
    } finally {
      setSavingPeriod(false);
    }
  }

  async function togglePeriod(period: VehicleRentalPeriod) {
    if (!rentalVehicle) return;
    try {
      await api.patch(`/vehicles/rental-periods/${period.id}`, { active: !period.active });
      await loadPeriods(rentalVehicle.id);
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de modifier cette période.');
    }
  }

  function confirmDeletePeriod(period: VehicleRentalPeriod) {
    if (!rentalVehicle) return;
    if (period.bookedDays > 0) {
      return Alert.alert('Impossible', 'Cette période a déjà des jours réservés — désactivez-la plutôt.');
    }
    Alert.alert('Supprimer cette période ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/vehicles/rental-periods/${period.id}`);
            await loadPeriods(rentalVehicle.id);
          } catch (err: any) {
            Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de supprimer cette période.');
          }
        },
      },
    ]);
  }

  async function choosePhoto() {
    setPickingPhoto(true);
    try {
      const uri = await pickPhotoFromDevice();
      if (uri) setForm((f) => ({ ...f, photoUrl: uri }));
    } finally {
      setPickingPhoto(false);
    }
  }

  const load = useCallback(() => {
    setLoading(true);
    return api.get('/vehicles/mine').then(({ data }) => setVehicles(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditingId(v.id);
    setForm({
      type: v.type, brand: v.brand, model: v.model, plateNumber: v.plateNumber || '',
      seatCapacity: String(v.seatCapacity), basePrice: String(v.basePrice),
      pricePerKm: v.pricePerKm ? String(v.pricePerKm) : '', photoUrl: v.photoUrl || '',
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.brand || !form.model || !form.plateNumber || !form.basePrice) {
      return Alert.alert('Champs requis', 'Marque, modèle, immatriculation et prix de base sont obligatoires.');
    }
    setSaving(true);
    const payload = {
      type: form.type, brand: form.brand, model: form.model, plateNumber: form.plateNumber,
      seatCapacity: Number(form.seatCapacity) || 4,
      basePrice: Number(form.basePrice) || 0,
      pricePerKm: form.pricePerKm ? Number(form.pricePerKm) : undefined,
      photoUrl: form.photoUrl || undefined,
    };
    try {
      if (editingId) await api.patch(`/vehicles/${editingId}`, payload);
      else await api.post('/vehicles', payload);
      setModalOpen(false);
      await load();
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Impossible d\'enregistrer ce véhicule.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(id: string) {
    Alert.alert('Supprimer ce véhicule ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await api.delete(`/vehicles/${id}`); load(); } },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.display}>Mes véhicules</Text>
        <Pressable style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ocean} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={<Text style={typography.bodyMuted}>Vous n'avez pas encore ajouté de véhicule.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.thumb}>
                  {item.photoUrl ? <Image source={{ uri: item.photoUrl }} style={styles.thumbImg} /> : <Text style={{ fontSize: 24 }}>🚗</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={typography.h2}>{item.brand} {item.model}</Text>
                  <Text style={styles.plate}>{item.plateNumber} · {item.seatCapacity} places</Text>
                  <Text style={styles.price}>{item.basePrice.toLocaleString('fr-FR')} KMF{item.status !== 'ACTIVE' ? ` · ${item.status}` : ''}</Text>
                </View>
              </View>
              <View style={styles.actionsRow}>
                <Pressable style={styles.editBtn} onPress={() => openEdit(item)}><Text style={styles.editBtnText}>Modifier</Text></Pressable>
                <Pressable style={styles.rentBtn} onPress={() => openRental(item)}><Text style={styles.rentBtnText}>🔑 Location</Text></Pressable>
                <Pressable style={styles.deleteBtn} onPress={() => confirmDelete(item.id)}><Text style={styles.deleteBtnText}>Supprimer</Text></Pressable>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={typography.h1}>{editingId ? 'Modifier le véhicule' : 'Nouveau véhicule'}</Text>

              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {VEHICLE_TYPES.map((t) => (
                  <Pressable key={t} style={[styles.typePill, form.type === t && styles.typePillActive]} onPress={() => setForm({ ...form, type: t })}>
                    <Text style={[styles.typePillText, form.type === t && styles.typePillTextActive]}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Marque</Text>
              <TextInput style={styles.input} value={form.brand} onChangeText={(v) => setForm({ ...form, brand: v })} placeholder="Toyota" placeholderTextColor={colors.slate} />
              <Text style={styles.label}>Modèle</Text>
              <TextInput style={styles.input} value={form.model} onChangeText={(v) => setForm({ ...form, model: v })} placeholder="Hilux" placeholderTextColor={colors.slate} />
              <Text style={styles.label}>Immatriculation</Text>
              <TextInput style={styles.input} value={form.plateNumber} onChangeText={(v) => setForm({ ...form, plateNumber: v })} placeholder="AB-1234-KM" placeholderTextColor={colors.slate} />
              <Text style={styles.label}>Nombre de places</Text>
              <TextInput style={styles.input} value={form.seatCapacity} onChangeText={(v) => setForm({ ...form, seatCapacity: v })} keyboardType="numeric" placeholderTextColor={colors.slate} />
              <Text style={styles.label}>Prix de base (KMF)</Text>
              <TextInput style={styles.input} value={form.basePrice} onChangeText={(v) => setForm({ ...form, basePrice: v })} keyboardType="numeric" placeholder="15000" placeholderTextColor={colors.slate} />
              <Text style={styles.label}>Prix / km (optionnel)</Text>
              <TextInput style={styles.input} value={form.pricePerKm} onChangeText={(v) => setForm({ ...form, pricePerKm: v })} keyboardType="numeric" placeholderTextColor={colors.slate} />
              <Text style={styles.label}>Photo du véhicule (optionnel)</Text>
              <View style={styles.photoRow}>
                <View style={styles.photoPreview}>
                  {form.photoUrl ? (
                    <Image source={{ uri: form.photoUrl }} style={styles.photoPreviewImg} />
                  ) : (
                    <Text style={{ fontSize: 26 }}>🚗</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Pressable style={styles.photoBtn} onPress={choosePhoto} disabled={pickingPhoto}>
                    <Text style={styles.photoBtnText}>
                      {pickingPhoto ? 'Chargement...' : form.photoUrl ? 'Changer la photo' : 'Importer une photo'}
                    </Text>
                  </Pressable>
                  {!!form.photoUrl && (
                    <Pressable onPress={() => setForm((f) => ({ ...f, photoUrl: '' }))}>
                      <Text style={styles.photoRemove}>Retirer la photo</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelBtn} onPress={() => setModalOpen(false)}><Text style={styles.cancelBtnText}>Annuler</Text></Pressable>
                <Pressable style={styles.saveBtn} onPress={save} disabled={saving}><Text style={styles.saveBtnText}>{saving ? '...' : 'Enregistrer'}</Text></Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!rentalVehicle} animationType="slide" transparent onRequestClose={() => setRentalVehicle(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView>
              <Text style={typography.h1}>Mettre en location</Text>
              <Text style={typography.bodyMuted}>{rentalVehicle?.brand} {rentalVehicle?.model}</Text>

              <Text style={styles.label}>Périodes de location</Text>
              {loadingPeriods ? (
                <ActivityIndicator color={colors.ocean} style={{ marginTop: 12 }} />
              ) : rentalPeriods.length === 0 ? (
                <Text style={typography.bodyMuted}>Aucune période pour l'instant.</Text>
              ) : (
                rentalPeriods.map((p) => (
                  <View key={p.id} style={styles.periodCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.periodDates}>
                        Du {new Date(p.startDate).toLocaleDateString('fr-FR')} au {new Date(p.endDate).toLocaleDateString('fr-FR')}
                      </Text>
                      <Text style={styles.periodMeta}>
                        {p.remainingDays} / {p.totalDays} jour{p.totalDays > 1 ? 's' : ''} restant{p.remainingDays > 1 ? 's' : ''}
                        {!p.active ? ' · Désactivée' : ''}
                      </Text>
                    </View>
                    <Pressable style={[styles.periodToggle, p.active && styles.periodToggleActive]} onPress={() => togglePeriod(p)}>
                      <Text style={[styles.periodToggleText, p.active && styles.periodToggleTextActive]}>{p.active ? 'Active' : 'Inactive'}</Text>
                    </Pressable>
                    <Pressable onPress={() => confirmDeletePeriod(p)} style={{ marginLeft: 10 }}>
                      <Text style={styles.periodDelete}>Suppr.</Text>
                    </Pressable>
                  </View>
                ))
              )}

              <Text style={styles.label}>Nouvelle période (ex : du 1er au 7 septembre)</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLabel}>Date de début</Text>
                  <TextInput
                    style={styles.input}
                    value={periodForm.startDate}
                    onChangeText={(v) => setPeriodForm({ ...periodForm, startDate: v })}
                    placeholder="2026-09-01"
                    placeholderTextColor={colors.slate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.subLabel}>Date de fin</Text>
                  <TextInput
                    style={styles.input}
                    value={periodForm.endDate}
                    onChangeText={(v) => setPeriodForm({ ...periodForm, endDate: v })}
                    placeholder="2026-09-07"
                    placeholderTextColor={colors.slate}
                  />
                </View>
              </View>
              <Pressable style={styles.addPeriodBtn} onPress={addPeriod} disabled={savingPeriod}>
                <Text style={styles.addPeriodBtnText}>{savingPeriod ? 'Ajout...' : '+ Ajouter cette période'}</Text>
              </Pressable>

              <View style={styles.modalActions}>
                <Pressable style={styles.saveBtn} onPress={() => setRentalVehicle(null)}><Text style={styles.saveBtnText}>Fermer</Text></Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { backgroundColor: colors.ocean, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 12.5 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.line },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center', marginRight: 14, overflow: 'hidden' },
  thumbImg: { width: 56, height: 56 },
  plate: { fontSize: 12, color: colors.slate, marginTop: 2 },
  price: { fontSize: 13, fontWeight: '700', color: colors.ocean, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  editBtn: { flex: 1, borderRadius: radius.pill, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.sandDeep },
  editBtnText: { fontWeight: '700', fontSize: 12.5, color: colors.charcoal },
  deleteBtn: { flex: 1, borderRadius: radius.pill, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: colors.danger },
  deleteBtnText: { fontWeight: '700', fontSize: 12.5, color: colors.danger },
  rentBtn: { flex: 1, borderRadius: radius.pill, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.lavender },
  rentBtnText: { fontWeight: '700', fontSize: 12, color: colors.charcoal },
  row: { flexDirection: 'row', gap: 10 },
  subLabel: { ...typography.caption, marginBottom: 6, marginTop: 10 },
  periodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, padding: 12, marginTop: 10, borderWidth: 1, borderColor: colors.line },
  periodDates: { fontSize: 13, fontWeight: '700', color: colors.charcoal },
  periodMeta: { fontSize: 11, fontWeight: '600', color: colors.slate, marginTop: 2 },
  periodToggle: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.line },
  periodToggleActive: { backgroundColor: colors.lagoon, borderColor: colors.lagoon },
  periodToggleText: { fontSize: 10.5, fontWeight: '700', color: colors.slate },
  periodToggleTextActive: { color: colors.white },
  periodDelete: { fontSize: 11, fontWeight: '700', color: colors.danger },
  addPeriodBtn: { backgroundColor: colors.ocean, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  addPeriodBtnText: { fontWeight: '700', color: colors.white, fontSize: 13.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.sand, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '88%' },
  label: { ...typography.caption, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: colors.line, fontSize: 14, color: colors.charcoal },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  photoPreview: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  photoPreviewImg: { width: 64, height: 64 },
  photoBtn: { backgroundColor: colors.white, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1.5, borderColor: colors.ocean, alignSelf: 'flex-start' },
  photoBtnText: { fontWeight: '700', fontSize: 12.5, color: colors.ocean },
  photoRemove: { color: colors.danger, fontSize: 11.5, fontWeight: '700', marginTop: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  typePillActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  typePillText: { fontSize: 12, fontWeight: '700', color: colors.charcoal },
  typePillTextActive: { color: colors.white },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24, marginBottom: 10 },
  cancelBtn: { flex: 1, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: colors.line },
  cancelBtnText: { fontWeight: '700', color: colors.charcoal },
  saveBtn: { flex: 1, borderRadius: radius.pill, paddingVertical: 14, alignItems: 'center', backgroundColor: colors.ocean },
  saveBtnText: { fontWeight: '700', color: colors.white },
});
