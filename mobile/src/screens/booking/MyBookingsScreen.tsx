import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, ScrollView, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';
import { Booking } from '../../types';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', ONGOING: 'En cours', COMPLETED: 'Terminée', CANCELLED: 'Annulée',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: colors.ylang, CONFIRMED: colors.lagoon, ONGOING: colors.ocean, COMPLETED: colors.success, CANCELLED: colors.danger,
};

const FILTERS = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'CONFIRMED', label: 'Confirmées' },
  { key: 'SORTIES', label: 'Sorties planifiées' },
];

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function MyBookingsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      api.get('/bookings/mine').then(({ data }) => { if (active) setBookings(data); }).finally(() => active && setLoading(false));
      return () => { active = false; };
    }, [])
  );

  const sorties = useMemo(() => bookings.filter((b) => b.bookingType === 'PRIVATE_FULL_DAY' && b.status !== 'CANCELLED'), [bookings]);

  const sortiesThisMonth = useMemo(() => {
    const map: Record<number, Booking[]> = {};
    sorties.forEach((b) => {
      const d = new Date(b.scheduledDate);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        map[d.getDate()] = [...(map[d.getDate()] || []), b];
      }
    });
    return map;
  }, [sorties, viewYear, viewMonth]);

  const filteredList = useMemo(() => {
    if (filter === 'ALL') return bookings;
    if (filter === 'PENDING') return bookings.filter((b) => b.status === 'PENDING');
    if (filter === 'CONFIRMED') return bookings.filter((b) => b.status === 'CONFIRMED');
    return [];
  }, [bookings, filter]);

  const cells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  function changeMonth(delta: number) {
    let m = viewMonth + delta, y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m); setViewYear(y); setSelectedDay(null);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography.display}>Mes réservations</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} style={[styles.filterPill, filter === f.key && styles.filterPillActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ocean} />
      ) : bookings.length === 0 ? (
        <View style={styles.emptyAll}>
          <Image source={require('../../../assets/logo-mark.png')} style={styles.emptyLogo} resizeMode="contain" />
          <Text style={styles.emptyText}>Vous n'avez aucune réservation pour le moment.</Text>
        </View>
      ) : filter === 'SORTIES' ? (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
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
                const hasSortie = day != null && !!sortiesThisMonth[day];
                const isSelected = day === selectedDay;
                return (
                  <Pressable key={idx} disabled={day == null} onPress={() => setSelectedDay(day)} style={styles.dayCell}>
                    {day != null && (
                      <View style={[styles.dayInner, isSelected && styles.dayInnerSelected]}>
                        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                        {hasSortie && <View style={[styles.dot, isSelected && { backgroundColor: colors.white }]} />}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            {selectedDay ? `Sorties du ${selectedDay} ${MONTH_NAMES[viewMonth]}` : 'Sélectionnez un jour avec un point pour voir le détail'}
          </Text>
          {selectedDay && (sortiesThisMonth[selectedDay] || []).map((b) => (
            <BookingCard key={b.id} booking={b} onPress={() => b.trip && navigation.navigate('TripTracking', { booking: b })} />
          ))}
          {selectedDay && !(sortiesThisMonth[selectedDay] || []).length && (
            <Text style={typography.bodyMuted}>Aucune sortie planifiée ce jour-là.</Text>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <BookingCard booking={item} onPress={() => item.trip && item.status !== 'CANCELLED' ? navigation.navigate('TripTracking', { booking: item }) : null} />
          )}
          ListEmptyComponent={<Text style={typography.bodyMuted}>Aucune réservation dans cette catégorie.</Text>}
          ListFooterComponent={filteredList.length > 0 ? (
            <View style={styles.helpCard}>
              <Text style={styles.helpText}>
                ℹ️ Bon à savoir : vous pouvez annuler ou modifier vos réservations depuis le détail de chaque réservation.
              </Text>
              <View style={styles.helpBtnRow}>
                <Pressable style={styles.helpBtn}><Text style={styles.helpBtnText}>🎧 Besoin d'aide ?</Text></Pressable>
              </View>
            </View>
          ) : null}
        />
      )}
    </View>
  );
}

function BookingCard({ booking, onPress }: { booking: Booking; onPress: () => void }) {
  const isParticulier = booking.agency.type === 'PARTICULIER';
  const isPaid = booking.paymentStatus === 'PAID';
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.badgeStatusRow}>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[booking.status] + '22' }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLORS[booking.status] }]}>{STATUS_LABELS[booking.status]}</Text>
        </View>
      </View>

      <View style={styles.cardTop}>
        <View style={styles.thumb}>
          {booking.vehicle.photoUrl ? (
            <Image source={{ uri: booking.vehicle.photoUrl }} style={styles.thumbImg} />
          ) : (
            <Text style={{ fontSize: 26 }}>🚗</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.h2}>{booking.vehicle.brand} {booking.vehicle.model}</Text>
          <View style={styles.tagsRow}>
            <View style={[styles.tag, isParticulier ? styles.tagParticulier : styles.tagAgence]}>
              <Text style={styles.tagText}>{isParticulier ? '● Particulier' : '● Agence'}</Text>
            </View>
          </View>
          <Text style={styles.ownerName}>👤 {booking.agency.name}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>📅</Text>
        <Text style={styles.infoText}>
          {new Date(booking.scheduledDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} · {new Date(booking.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      {!!booking.pickupName && (
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoText}>{booking.pickupName}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.reference}>{booking.reference}</Text>
          <View style={[styles.payBadge, isPaid ? styles.payBadgePaid : styles.payBadgePending]}>
            <Text style={[styles.payBadgeText, { color: isPaid ? colors.success : colors.ylang }]}>
              {isPaid ? (booking.paymentMethod === 'MOBILE_MONEY' ? '💳 PAYÉ' : '💳 PAYÉ') : '⏳ À PAYER SUR PLACE'}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={typography.caption}>Total</Text>
          <Text style={styles.price}>{booking.totalPrice.toLocaleString('fr-FR')} KMF</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  emptyAll: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 80 },
  emptyLogo: { width: 84, height: 84, marginBottom: 18, opacity: 0.85 },
  emptyText: { fontSize: 14.5, color: colors.slate, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  filtersRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 8, paddingBottom: 10 },
  filterPill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  filterPillActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.charcoal },
  filterTextActive: { color: colors.white },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.line },
  badgeStatusRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center', marginRight: 14, overflow: 'hidden' },
  thumbImg: { width: 56, height: 56, borderRadius: radius.md },
  tagsRow: { flexDirection: 'row', marginTop: 4 },
  tag: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  tagParticulier: { backgroundColor: colors.lavender },
  tagAgence: { backgroundColor: colors.sandDeep },
  tagText: { fontSize: 9, fontWeight: '700', color: colors.charcoal },
  ownerName: { fontSize: 11, color: colors.slate, marginTop: 4, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoIcon: { fontSize: 11 },
  infoText: { fontSize: 11.5, color: colors.slate, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  reference: { fontSize: 11, fontWeight: '700', color: colors.charcoal, marginBottom: 5 },
  payBadge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  payBadgePaid: { backgroundColor: colors.success + '18' },
  payBadgePending: { backgroundColor: colors.ylang + '20' },
  payBadgeText: { fontSize: 9, fontWeight: '800' },
  helpCard: { backgroundColor: colors.sandDeep, marginHorizontal: 20, marginTop: 8, marginBottom: 20, borderRadius: radius.lg, padding: 16 },
  helpText: { fontSize: 11.5, color: colors.slate, lineHeight: 16 },
  helpBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  helpBtn: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.line },
  helpBtnText: { fontSize: 11, fontWeight: '700', color: colors.charcoal },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 11, fontWeight: '700' },
  price: { fontWeight: '800', color: colors.ocean },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },

  calendarCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.line, marginBottom: 20 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  calendarNav: { fontSize: 22, color: colors.ocean, fontWeight: '700', paddingHorizontal: 10 },
  calendarMonth: { fontSize: 15, fontWeight: '800', color: colors.charcoal, textTransform: 'capitalize' },
  weekdaysRow: { flexDirection: 'row', marginBottom: 6 },
  weekdayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: colors.slate },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayInner: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayInnerSelected: { backgroundColor: colors.ocean },
  dayText: { fontSize: 13, color: colors.charcoal, fontWeight: '600' },
  dayTextSelected: { color: colors.white },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.coral, position: 'absolute', bottom: 2 },
  sectionTitle: { ...typography.h2, fontSize: 14, marginBottom: 10 },
});
