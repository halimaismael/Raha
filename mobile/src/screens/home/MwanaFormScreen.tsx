import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';

// Même liste de villes que le reste du parcours (BecomeProfessionalScreen).
const CITIES = ['Moroni', 'Mitsamiouli', 'Foumbouni', 'Mbéni', 'Ouzioini', 'Mitsoudjé', 'Dembéni'];

// Les clés correspondent à l'enum MwanaDuration côté backend (schema.prisma).
const DURATIONS = [
  { key: 'UNE_SEMAINE', label: '1 semaine', hint: "Pour essayer le service" },
  { key: 'UN_MOIS', label: '1 mois', hint: 'Engagement mensuel' },
  { key: 'UN_TRIMESTRE', label: '1 trimestre', hint: '~3 mois' },
  { key: 'ANNEE_SCOLAIRE', label: "Toute l'année scolaire", hint: "Jusqu'aux grandes vacances" },
];

const TRIPS_PER_DAY = [
  { key: 1, label: '1', hint: 'Aller simple' },
  { key: 2, label: '2', hint: 'Aller-retour' },
  { key: 3, label: '3', hint: 'Matin, midi, soir' },
  { key: 4, label: '4+', hint: 'Plusieurs enfants / écoles' },
];

const MIN_PEOPLE = 1;
const MAX_PEOPLE = 8;

// Ajuste la liste des noms d'enfants pour qu'elle ait toujours exactement
// `count` entrées, en conservant celles déjà saisies.
function resizeNames(names: string[], count: number): string[] {
  const next = names.slice(0, count);
  while (next.length < count) next.push('');
  return next;
}

export default function MwanaFormScreen({ route, navigation }: any) {
  const { title } = route.params || {};

  const [duration, setDuration] = useState<string | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [childrenNames, setChildrenNames] = useState<string[]>(['']);
  const [tripsPerDay, setTripsPerDay] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [error, setError] = useState('');

  const durationLabel = DURATIONS.find((d) => d.key === duration)?.label;

  function changePeople(next: number) {
    setNumberOfPeople(next);
    setChildrenNames((names) => resizeNames(names, next));
  }

  function setChildName(index: number, value: string) {
    setChildrenNames((names) => {
      const copy = [...names];
      copy[index] = value;
      return copy;
    });
  }

  function handleContinue() {
    if (!duration || !tripsPerDay || !city) {
      setError('Merci de répondre à toutes les questions avant de continuer.');
      return;
    }
    if (childrenNames.some((n) => !n.trim())) {
      setError("Merci d'indiquer le nom de chaque enfant concerné.");
      return;
    }
    setError('');
    navigation.navigate('MwanaAppointment', {
      title: title || 'Raha Mwana',
      duration,
      durationLabel,
      numberOfPeople,
      childrenNames: childrenNames.map((n) => n.trim()),
      tripsPerDay,
      city,
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60, paddingBottom: 60 }}>
      <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>

      <View style={styles.badge}><Text style={{ fontSize: 26 }}>🚸</Text></View>
      <Text style={typography.display}>{title || 'Raha Mwana'}</Text>
      <Text style={styles.intro}>
        Décrivez votre besoin d'accompagnement scolaire. Ces informations nous permettent de vous proposer
        le chauffeur le mieux adapté et de préparer votre dossier avant le rendez-vous en agence.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Durée souhaitée */}
      <Text style={styles.sectionTitle}>Pendant combien de temps souhaitez-vous un chauffeur ?</Text>
      <Text style={styles.sectionHint}>Choisissez la durée de l'accompagnement.</Text>
      <View style={styles.optionGrid}>
        {DURATIONS.map((d) => {
          const active = duration === d.key;
          return (
            <Pressable key={d.key} style={[styles.optionCard, active && styles.optionCardActive]} onPress={() => setDuration(d.key)}>
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{d.label}</Text>
              <Text style={[styles.optionHint, active && styles.optionHintActive]}>{d.hint}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Nombre de personnes */}
      <Text style={styles.sectionTitle}>Combien de personnes seront transportées ?</Text>
      <Text style={styles.sectionHint}>Nombre d'enfants (ou d'élèves) concernés.</Text>
      <View style={styles.stepperRow}>
        <Pressable
          style={[styles.stepperBtn, numberOfPeople <= MIN_PEOPLE && styles.stepperBtnDisabled]}
          onPress={() => changePeople(Math.max(MIN_PEOPLE, numberOfPeople - 1))}
          disabled={numberOfPeople <= MIN_PEOPLE}
        >
          <Text style={styles.stepperBtnText}>−</Text>
        </Pressable>
        <View style={styles.stepperValueBox}>
          <Text style={styles.stepperValue}>{numberOfPeople}</Text>
          <Text style={styles.stepperValueLabel}>{numberOfPeople > 1 ? 'personnes' : 'personne'}</Text>
        </View>
        <Pressable
          style={[styles.stepperBtn, numberOfPeople >= MAX_PEOPLE && styles.stepperBtnDisabled]}
          onPress={() => changePeople(Math.min(MAX_PEOPLE, numberOfPeople + 1))}
          disabled={numberOfPeople >= MAX_PEOPLE}
        >
          <Text style={styles.stepperBtnText}>+</Text>
        </Pressable>
      </View>

      {/* Nom de chaque enfant */}
      <Text style={styles.sectionTitle}>Nom {numberOfPeople > 1 ? 'des enfants' : "de l'enfant"}</Text>
      <Text style={styles.sectionHint}>
        {numberOfPeople > 1 ? 'Un nom par enfant transporté.' : "Le nom complet de l'enfant transporté."}
      </Text>
      {childrenNames.map((name, index) => (
        <View key={index} style={{ marginBottom: 10 }}>
          {numberOfPeople > 1 && <Text style={styles.label}>Enfant {index + 1}</Text>}
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(v) => setChildName(index, v)}
            placeholder="Nom et prénom de l'enfant"
            placeholderTextColor={colors.slate}
          />
        </View>
      ))}

      {/* Trajets par jour */}
      <Text style={styles.sectionTitle}>Combien de fois par jour ?</Text>
      <Text style={styles.sectionHint}>Nombre de trajets quotidiens (dépôt, récupération...).</Text>
      <View style={styles.wrapRow}>
        {TRIPS_PER_DAY.map((t) => {
          const active = tripsPerDay === t.key;
          return (
            <Pressable key={t.key} style={[styles.tripPill, active && styles.optionCardActive]} onPress={() => setTripsPerDay(t.key)}>
              <Text style={[styles.tripPillNumber, active && styles.optionLabelActive]}>{t.label}</Text>
              <Text style={[styles.tripPillHint, active && styles.optionHintActive]}>{t.hint}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Ville */}
      <Text style={styles.sectionTitle}>Dans quelle ville habitez-vous ?</Text>
      <Text style={styles.sectionHint}>La ville où se situe le trajet école / domicile.</Text>
      <View style={styles.wrapRow}>
        {CITIES.map((c) => (
          <Pressable key={c} style={[styles.pill, city === c && styles.pillActive]} onPress={() => setCity(c)}>
            <Text style={[styles.pillText, city === c && styles.pillTextActive]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.primaryBtn} onPress={handleContinue}>
        <Text style={styles.primaryBtnText}>Envoyer le formulaire →</Text>
      </Pressable>
      <Text style={styles.footNote}>
        Prochaine étape : prendre rendez-vous avec une agence Raha pour finaliser votre dossier.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  badge: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#EAF3F2', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  intro: { fontSize: 14, color: colors.slate, marginTop: 8, lineHeight: 20 },
  error: { backgroundColor: '#FDECEC', color: colors.danger, fontSize: 13, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, marginTop: 20 },

  sectionTitle: { fontSize: 15.5, fontWeight: '800', color: colors.charcoal, marginTop: 26 },
  sectionHint: { fontSize: 12.5, color: colors.slate, marginTop: 3, marginBottom: 12, lineHeight: 17 },

  label: { ...typography.caption, marginBottom: 6 },
  input: { backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 13, borderWidth: 1, borderColor: colors.line, fontSize: 14.5, color: colors.charcoal },

  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionCard: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: colors.white, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.line, padding: 14,
  },
  optionCardActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  optionLabel: { fontSize: 13.5, fontWeight: '800', color: colors.charcoal },
  optionLabelActive: { color: colors.white },
  optionHint: { fontSize: 11, color: colors.slate, marginTop: 3, lineHeight: 15 },
  optionHintActive: { color: 'rgba(255,255,255,0.8)' },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14 },
  stepperBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center' },
  stepperBtnDisabled: { opacity: 0.4 },
  stepperBtnText: { fontSize: 20, fontWeight: '800', color: colors.charcoal },
  stepperValueBox: { flex: 1, alignItems: 'center' },
  stepperValue: { fontSize: 24, fontWeight: '800', color: colors.charcoal },
  stepperValueLabel: { fontSize: 12, color: colors.slate, marginTop: 2 },

  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tripPill: {
    minWidth: 78, alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.line, paddingVertical: 12, paddingHorizontal: 10,
  },
  tripPillNumber: { fontSize: 17, fontWeight: '800', color: colors.charcoal },
  tripPillHint: { fontSize: 10, color: colors.slate, marginTop: 3, textAlign: 'center' },

  pill: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  pillActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.charcoal },
  pillTextActive: { color: colors.white },

  primaryBtn: { backgroundColor: colors.ocean, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center', marginTop: 32, minHeight: 52, justifyContent: 'center' },
  primaryBtnText: { ...typography.button },
  footNote: { fontSize: 11.5, color: colors.slate, textAlign: 'center', marginTop: 12, lineHeight: 16 },
});
