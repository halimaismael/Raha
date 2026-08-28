import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme/colors';

interface Props {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}

export default function VehicleTypeChip({ label, icon, active, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    marginRight: 10,
  },
  chipActive: { backgroundColor: colors.ocean, borderColor: colors.ocean },
  icon: { fontSize: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.charcoal },
  labelActive: { color: colors.white },
});
