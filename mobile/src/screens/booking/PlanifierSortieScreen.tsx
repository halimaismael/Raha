import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';

const MOTIFS = ['En famille', 'Entre amis', 'Pour le travail', 'Rendez-vous personnel', 'Autre'];
const TIME_SLOTS = ['07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function PlanifierSortieScreen({ navigation }: any) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[2]);
  const [motif, setMotif] = useState(MOTIFS[0]);
  const [notes, setNotes] = useState('');

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
    setSelectedDay(null);
  }

  function handleContinue() {
    if (!selectedDay) return;
    const scheduledDate = new Date(viewYear, viewMonth, selectedDay);
    const [h, m] = selectedTime.split(':').map(Number);
    scheduledDate.setHours(h, m, 0, 0);
    navigation.navigate('ChooseProvider', {
      title: 'Voitures disponibles pour votre sortie',
      purpose: `${motif}${notes ? ' — ' + notes : ''}`,
      scheduledDateISO: scheduledDate.toISOString(),
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 60 }}>
      <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>
      <Text style={typography.display}>Planifiez votre sortie</Text>
      <Text style={typography.bodyMuted}>Choisissez le jour, l'heure et le type de sortie.</Text>

      {/* Calendrier */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Pressable onPress={() => changeMonth(-1)}><Text style={styles.calendarNav}>‹</Text></Pressable>
          <Text style={styles.calendarMonth}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
          <Pressable onPress={() => changeMonth(1)}><Text style={styles.calendarNav}>›</Text></Pressable>
        </View>

        <View style={styles.weekdaysRow}>
          {WEEKDAY_LABELS.map((w, i) => <Text key={i} style={styles.weekdayLabel}>{w}</Text>)}
        </View>

        <View style={styles.grid}>
          {cells.map((day, idx) => {
            const isPast = day != null && new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isSelected = day === selectedDay;
            return (
              <Pressable
                key={idx}
                disabled={day == null || isPast}
                onPress={() => setSelectedDay(day)}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
              >
                {day != null && (
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected, isPast && styles.dayTextPast]}>{day}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Heure */}
      <Text style={styles.sectionTitle}>Heure de départ</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {TIME_SLOTS.map((t) => (
          <Pressable key={t} style={[styles.pill, selectedTime === t && styles.pillActive]} onPress={() => setSelectedTime(t)}>
            <Text style={[styles.pillText, selectedTime === t && styles.pillTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Type de sortie */}
      <Text style={styles.sectionTitle}>Type de sortie</Text>
      <View style={styles.wrapRow}>
        {MOTIFS.map((m) => (
          <Pressable key={m} style={[styles.pill, motif === m && styles.pillActive]} onPress={() => setMotif(m)}>
            <Text style={[styles.pillText, motif === m && styles.pillTextActive]}>{m}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Précisions (optionnel)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: sortie au restaurant, anniversaire..."
        value={notes}
        onChangeText={setNotes}
        placeholderTextColor={colors.slate}
      />

      <Pressable style={[styles.continueBtn, !selectedDay && { opacity: 0.5 }]} onPress={handleContinue} disabled={!selectedDay}>
        <Text style={styles.continueBtnText}>Voir les véhicules disponibles</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  calendarCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, marginTop: 24, borderWidth: 1, borderColor: colors.line },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  calendarNav: { fontSize: 22, color: colors.ocean, fontWeight: '700', paddingHorizontal: 10 },
  calendarMonth: { fontSize: 15, fontWeight: '800', color: colors.charcoal, textTransform: 'capitalize' },
  weekdaysRow: { flexDirection: 'row', marginBottom: 6 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.slate },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCellSelected: {},
  dayText: { fontSize: 13, color: colors.charcoal, fontWeight: '600' },
  dayTextPast: { color: colors.line },
  dayTextSelected: { color: colors.white, backgroundColor: colors.ocean, width: 30, height: 30, borderRadius: 15, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden' },
  sectionTitle: { ...typography.h2, fontSize: 15, marginTop: 22, marginBottom: 10 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  pillActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.charcoal },
  pillTextActive: { color: colors.white },
  input: { backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.line, fontSize: 14, color: colors.charcoal },
  continueBtn: { backgroundColor: colors.coral, borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center', marginTop: 30 },
  continueBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
