import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { pickPhotoFromDevice } from '../../utils/imagePicker';

const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

function buildNextDays(count: number) {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function MwanaAppointmentScreen({ route, navigation }: any) {
  const { title, duration, durationLabel, numberOfPeople, childrenNames, tripsPerDay, city } = route.params || {};

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [documents, setDocuments] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const nextDays = useMemo(() => buildNextDays(14), []);

  async function handleAddDocument() {
    const photo = await pickPhotoFromDevice();
    if (photo) setDocuments((docs) => [...docs, photo]);
  }

  function handleRemoveDocument(index: number) {
    Alert.alert('Retirer ce justificatif ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: () => setDocuments((docs) => docs.filter((_, i) => i !== index)) },
    ]);
  }

  async function handleConfirm() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      setError('Merci de renseigner votre nom, prénom et numéro de contact.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Merci de renseigner une adresse email valide.');
      return;
    }
    if (documents.length === 0) {
      setError("Merci de joindre au moins un justificatif (pièce d'identité, extrait de naissance ou carte scolaire de l'enfant).");
      return;
    }
    if (!selectedDay || !selectedTime) {
      setError('Merci de choisir un jour et une heure de rendez-vous.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const [h, m] = selectedTime.split(':').map(Number);
      const appointmentDate = new Date(selectedDay);
      appointmentDate.setHours(h, m, 0, 0);

      const { data } = await api.post('/mwana-requests', {
        duration,
        numberOfPeople,
        childrenNames,
        tripsPerDay,
        city,
        contactFirstName: firstName.trim(),
        contactLastName: lastName.trim(),
        contactEmail: email.trim(),
        contactPhone: phone.trim(),
        documents,
        appointmentDate: appointmentDate.toISOString(),
      });
      setReference(data?.reference || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Envoi impossible pour le moment, réessayez.');
    } finally {
      setLoading(false);
    }
  }

  if (reference && selectedDay && selectedTime) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 60 }}>
        <View style={styles.successBadge}><Text style={{ fontSize: 30 }}>✅</Text></View>
        <Text style={typography.display}>Rendez-vous confirmé</Text>
        <Text style={styles.successText}>
          Votre demande {reference} pour {title || 'Raha Mwana'} a bien été enregistrée. Présentez-vous
          en agence au créneau choisi avec les originaux de vos justificatifs pour finaliser votre dossier.
        </Text>

        <View style={styles.recapCard}>
          <Text style={styles.recapTitle}>Récapitulatif du rendez-vous</Text>
          <RecapRow label="Référence" value={reference} />
          <RecapRow label="Rendez-vous" value={`${DAY_NAMES[selectedDay.getDay()]} ${selectedDay.getDate()} ${MONTH_SHORT[selectedDay.getMonth()]} à ${selectedTime}`} />
          <RecapRow label="Ville" value={city} />
          <RecapRow label="Durée souhaitée" value={durationLabel} />
          <RecapRow label="Personnes" value={`${numberOfPeople}`} />
          <RecapRow label="Enfant(s)" value={Array.isArray(childrenNames) ? childrenNames.join(', ') : undefined} />
          <RecapRow label="Trajets / jour" value={`${tripsPerDay}`} />
          <RecapRow label="Contact" value={`${firstName} ${lastName}`} />
          <RecapRow label="Email" value={email} />
          <RecapRow label="Téléphone" value={phone} />
          <RecapRow label="Justificatifs joints" value={`${documents.length}`} />
        </View>

        <View style={styles.reminderCard}>
          <Text style={styles.reminderTitle}>⚠️ À apporter le jour du rendez-vous</Text>
          <Text style={styles.reminderItem}>• Une pièce d'identité valide (vous-même)</Text>
          <Text style={styles.reminderItem}>• Les originaux des justificatifs de l'enfant que vous avez joints</Text>
          <Text style={styles.reminderItem}>• Arrivez 10 minutes avant votre créneau</Text>
        </View>

        <Pressable style={styles.primaryBtn} onPress={() => navigation.popToTop()}>
          <Text style={styles.primaryBtnText}>Retour à l'accueil</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 60 }}>
      <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>

      <Text style={typography.display}>Rendez-vous en agence</Text>
      <Text style={styles.intro}>
        Le service {title || 'Raha Mwana'} nécessite une inscription en personne. Joignez dès maintenant vos
        justificatifs, puis présentez-vous en agence avec les originaux pour finaliser votre dossier.
      </Text>

      <View style={styles.recapCard}>
        <Text style={styles.recapTitle}>Votre demande</Text>
        <RecapRow label="Durée souhaitée" value={durationLabel} />
        <RecapRow label="Personnes" value={`${numberOfPeople}`} />
        <RecapRow label="Enfant(s)" value={Array.isArray(childrenNames) ? childrenNames.join(', ') : undefined} />
        <RecapRow label="Trajets / jour" value={`${tripsPerDay}`} />
        <RecapRow label="Ville" value={city} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Vos coordonnées</Text>
      <Text style={styles.sectionHint}>Pour vous contacter et confirmer votre rendez-vous.</Text>

      <Text style={styles.label}>Prénom</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Fatima" placeholderTextColor={colors.slate} />

      <Text style={styles.label}>Nom</Text>
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Ali" placeholderTextColor={colors.slate} />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="vous@exemple.com" placeholderTextColor={colors.slate} />

      <Text style={styles.label}>Numéro de contact</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+269 3XX XX XX" placeholderTextColor={colors.slate} />

      <Text style={styles.sectionTitle}>Justificatifs</Text>
      <Text style={styles.sectionHint}>
        Pièce d'identité de l'enfant, extrait de naissance ou carte scolaire. Vous pourrez en ajouter plusieurs.
      </Text>

      <View style={styles.docsGrid}>
        {documents.map((doc, index) => (
          <Pressable key={index} style={styles.docThumbWrap} onPress={() => handleRemoveDocument(index)}>
            <Image source={{ uri: doc }} style={styles.docThumb} />
            <View style={styles.docRemoveBadge}><Text style={styles.docRemoveText}>×</Text></View>
          </Pressable>
        ))}
        <Pressable style={styles.docAddBtn} onPress={handleAddDocument}>
          <Text style={styles.docAddIcon}>+</Text>
          <Text style={styles.docAddLabel}>Ajouter</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Choisissez un rendez-vous</Text>
      <Text style={styles.sectionHint}>Jour et heure de passage en agence.</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {nextDays.map((d) => {
          const active = selectedDay?.toDateString() === d.toDateString();
          return (
            <Pressable key={d.toISOString()} style={[styles.dayPill, active && styles.pillActive]} onPress={() => setSelectedDay(d)}>
              <Text style={[styles.dayPillWeekday, active && styles.pillTextActive]}>{DAY_NAMES[d.getDay()]}</Text>
              <Text style={[styles.dayPillDate, active && styles.pillTextActive]}>{d.getDate()} {MONTH_SHORT[d.getMonth()]}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.wrapRow, { marginTop: 12 }]}>
        {TIME_SLOTS.map((t) => (
          <Pressable key={t} style={[styles.pill, selectedTime === t && styles.pillActive]} onPress={() => setSelectedTime(t)}>
            <Text style={[styles.pillText, selectedTime === t && styles.pillTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.reminderCard}>
        <Text style={styles.reminderTitle}>⚠️ À apporter le jour du rendez-vous</Text>
        <Text style={styles.reminderItem}>• Une pièce d'identité valide (vous-même)</Text>
        <Text style={styles.reminderItem}>• Les originaux des justificatifs joints ci-dessus</Text>
      </View>

      <Pressable style={styles.primaryBtn} onPress={handleConfirm} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Confirmer la demande de rendez-vous</Text>}
      </Pressable>
    </ScrollView>
  );
}

function RecapRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <View style={styles.recapRow}>
      <Text style={styles.recapLabel}>{label}</Text>
      <Text style={styles.recapValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  intro: { fontSize: 14, color: colors.slate, marginTop: 8, lineHeight: 20 },
  error: { backgroundColor: '#FDECEC', color: colors.danger, fontSize: 13, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, marginTop: 20 },

  recapCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 20 },
  recapTitle: { fontSize: 13.5, fontWeight: '800', color: colors.charcoal, marginBottom: 10 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.line },
  recapLabel: { fontSize: 12.5, color: colors.slate },
  recapValue: { fontSize: 12.5, fontWeight: '700', color: colors.charcoal, flexShrink: 1, textAlign: 'right' },

  sectionTitle: { fontSize: 15.5, fontWeight: '800', color: colors.charcoal, marginTop: 26 },
  sectionHint: { fontSize: 12.5, color: colors.slate, marginTop: 3, marginBottom: 12, lineHeight: 17 },

  label: { ...typography.caption, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1, borderColor: colors.line, fontSize: 14.5, color: colors.charcoal },

  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  pillActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.charcoal },
  pillTextActive: { color: colors.white },

  dayPill: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  dayPillWeekday: { fontSize: 10, fontWeight: '700', color: colors.slate, textTransform: 'uppercase' },
  dayPillDate: { fontSize: 12.5, fontWeight: '800', color: colors.charcoal, marginTop: 2 },

  docsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  docThumbWrap: { width: 76, height: 76, borderRadius: radius.md, overflow: 'hidden', position: 'relative' },
  docThumb: { width: '100%', height: '100%' },
  docRemoveBadge: { position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  docRemoveText: { color: colors.white, fontSize: 13, fontWeight: '800', lineHeight: 15 },
  docAddBtn: { width: 76, height: 76, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  docAddIcon: { fontSize: 22, fontWeight: '800', color: colors.ocean, lineHeight: 24 },
  docAddLabel: { fontSize: 10.5, color: colors.slate, marginTop: 2, fontWeight: '600' },

  reminderCard: { backgroundColor: '#FFF8E8', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16, marginTop: 22 },
  reminderTitle: { fontSize: 13, fontWeight: '800', color: colors.charcoal, marginBottom: 8 },
  reminderItem: { fontSize: 12.5, color: colors.charcoal, lineHeight: 19 },

  primaryBtn: { backgroundColor: colors.ocean, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center', marginTop: 30, minHeight: 52, justifyContent: 'center' },
  primaryBtnText: { ...typography.button },

  successBadge: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E3F6EE', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  successText: { fontSize: 14, color: colors.slate, marginTop: 10, lineHeight: 20 },
});
