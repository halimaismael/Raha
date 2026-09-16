import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function ProProfileScreen({ navigation }: any) {
  const { role, driverProfile, independentProfile, logout } = useAuth();
  const isIndependent = role === 'INDEPENDENT_DRIVER';
  const name = isIndependent
    ? `${independentProfile?.firstName ?? ''} ${independentProfile?.lastName ?? ''}`.trim()
    : driverProfile?.name ?? '';
  const phone = isIndependent ? independentProfile?.phone : driverProfile?.phone;
  const professionalCode = isIndependent ? independentProfile?.professionalCode : driverProfile?.professionalCode;
  const agencyName = !isIndependent ? driverProfile?.agency?.name : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name ? name.split(' ').map((p) => p.charAt(0)).slice(0, 2).join('') : '🚐'}</Text>
        </View>
        <Text style={typography.h1}>{name || 'Mon profil'}</Text>
        {!!phone && <Text style={typography.bodyMuted}>{phone}</Text>}
        {!!agencyName && <Text style={styles.agencyTag}>🏢 {agencyName}</Text>}
      </View>

      {professionalCode ? (
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Identifiant professionnel Raha</Text>
          <Text style={styles.codeValue}>{professionalCode}</Text>
        </View>
      ) : isIndependent && (
        <View style={[styles.codeCard, styles.codeCardPending]}>
          <Text style={styles.codeLabel}>Identifiant professionnel Raha</Text>
          <Text style={styles.codePendingValue}>⏳ En attente de validation par Raha</Text>
          <Text style={styles.codePendingSub}>Vous pouvez déjà utiliser l'application. Votre identifiant vous sera attribué après vérification de votre dossier.</Text>
        </View>
      )}

      <View style={styles.menu}>
        <MenuItem label="Mes réservations" icon="🎫" onPress={() => navigation.navigate('ProBookingsTab')} />
        <MenuItem label="Mes disponibilités" icon="🗓️" onPress={() => navigation.navigate('ProAvailability')} />
        {isIndependent && <MenuItem label="Mes véhicules" icon="🚗" onPress={() => navigation.navigate('ProVehicles')} />}
        {isIndependent && <MenuItem label="Mes tarifs" icon="💰" onPress={() => navigation.navigate('ProPricing')} />}
        <MenuItem label="Aide & support" icon="🆘" onPress={() => {}} />
      </View>

      <Pressable
        style={styles.logoutBtn}
        onPress={() => Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se déconnecter', style: 'destructive', onPress: logout },
        ])}
      >
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

function MenuItem({ label, icon, onPress }: { label: string; icon: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Text style={{ fontSize: 20, marginRight: 14 }}>{icon}</Text>
      <Text style={{ ...typography.body, flex: 1 }}>{label}</Text>
      <Text style={{ color: colors.slate, fontSize: 20 }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  containerContent: { paddingTop: 70, paddingHorizontal: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 18 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.ocean, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: '800' },
  agencyTag: { marginTop: 6, fontSize: 12, fontWeight: '700', color: colors.slate },
  codeCard: { backgroundColor: colors.onyx, borderRadius: radius.lg, padding: 16, alignItems: 'center', marginBottom: 20 },
  codeLabel: { color: colors.sand, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  codeValue: { color: colors.ylang, fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  codeCardPending: { backgroundColor: colors.sandDeep },
  codePendingValue: { color: colors.charcoal, fontSize: 14, fontWeight: '800' },
  codePendingSub: { color: colors.slate, fontSize: 11, textAlign: 'center', marginTop: 6, lineHeight: 15 },
  menu: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  logoutBtn: { marginTop: 30, alignItems: 'center', paddingVertical: 16 },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});
