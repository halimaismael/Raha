import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { colors, radius, typography } from '../theme/colors';
import { Agency } from '../types';

export default function AgencyCard({ agency, onPress }: { agency: Agency; onPress: () => void }) {
  const isParticulier = agency.type === 'PARTICULIER';
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.logo}>
        {agency.logoUrl ? (
          <Image source={{ uri: agency.logoUrl }} style={styles.logoImg} />
        ) : (
          <Text style={styles.logoLetter}>{isParticulier ? '🚗' : agency.name.charAt(0)}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={typography.h2}>{agency.name}</Text>
          <View style={[styles.badge, isParticulier ? styles.badgeParticulier : styles.badgeAgence]}>
            <Text style={styles.badgeText}>{isParticulier ? 'Particulier' : 'Agence'}</Text>
          </View>
        </View>
        <Text style={typography.bodyMuted}>{agency.city}</Text>
        {agency._count && (
          <Text style={styles.meta}>{agency._count.vehicles} véhicules · {agency._count.trips} trajets</Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  logo: {
    width: 52, height: 52, borderRadius: radius.md,
    backgroundColor: colors.sandDeep, alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  logoImg: { width: 52, height: 52, borderRadius: radius.md },
  logoLetter: { fontSize: 20, fontWeight: '800', color: colors.ocean },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeAgence: { backgroundColor: colors.sandDeep },
  badgeParticulier: { backgroundColor: colors.lavender },
  badgeText: { fontSize: 9, fontWeight: '700', color: colors.charcoal },
  meta: { ...typography.caption, marginTop: 4 },
  chevron: { fontSize: 24, color: colors.slate },
});
