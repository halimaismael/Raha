import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DriverAvailabilityEntry } from '../../types';

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function nextNDays(n: number) {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ProAvailabilityScreen() {
  const { role } = useAuth();
  const endpoint = role === 'INDEPENDENT_DRIVER' ? '/independent-drivers/me/availability' : '/drivers/me/availability';
  const [entries, setEntries] = useState<DriverAvailabilityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState<string | null>(null);
  const days = useMemo(() => nextNDays(30), []);

  const load = useCallback(() => {
    setLoading(true);
    return api.get(endpoint).then(({ data }) => setEntries(data)).catch(() => {}).finally(() => setLoading(false));
  }, [endpoint]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const byDate = useMemo(() => {
    const map: Record<string, DriverAvailabilityEntry> = {};
    entries.forEach((e) => { map[e.date.slice(0, 10)] = e; });
    return map;
  }, [entries]);

  async function toggleDay(d: Date) {
    const key = isoDay(d);
    const current = byDate[key];
    const nextStatus = current?.status === 'UNAVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE';
    setSavingDay(key);
    try {
      await api.put(endpoint, { date: key, status: nextStatus });
      await load();
    } catch {
      // silencieux
    } finally {
      setSavingDay(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.display}>Mes disponibilités</Text>
        <Text style={typography.bodyMuted}>Marquez les jours où vous n'êtes pas disponible. Par défaut, vous êtes visible tous les jours.</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ocean} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {days.map((d) => {
            const key = isoDay(d);
            const entry = byDate[key];
            const unavailable = entry?.status === 'UNAVAILABLE';
            const isBusy = savingDay === key;
            return (
              <Pressable key={key} style={[styles.row, unavailable && styles.rowUnavailable]} onPress={() => toggleDay(d)} disabled={isBusy}>
                <View>
                  <Text style={styles.dayLabel}>{DAY_LABELS[d.getDay()]} {d.getDate()} {MONTH_NAMES[d.getMonth()]}</Text>
                </View>
                <View style={[styles.statusPill, unavailable ? styles.statusPillOff : styles.statusPillOn]}>
                  <Text style={[styles.statusText, { color: unavailable ? colors.danger : colors.success }]}>
                    {isBusy ? '...' : unavailable ? 'Indisponible' : 'Disponible'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.line },
  rowUnavailable: { backgroundColor: colors.danger + '0A', borderColor: colors.danger + '40' },
  dayLabel: { fontSize: 13.5, fontWeight: '700', color: colors.charcoal, textTransform: 'capitalize' },
  statusPill: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  statusPillOn: { backgroundColor: colors.success + '18' },
  statusPillOff: { backgroundColor: colors.danger + '18' },
  statusText: { fontSize: 11.5, fontWeight: '700' },
});
