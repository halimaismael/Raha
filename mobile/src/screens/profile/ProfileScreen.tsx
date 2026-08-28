import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { colors, radius, typography } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</Text></View>
        <Text style={typography.h1}>{user?.firstName} {user?.lastName}</Text>
        <Text style={typography.bodyMuted}>{user?.phone}</Text>
      </View>

      <View style={styles.menu}>
        <MenuItem label="Mes informations" icon="👤" />
        <MenuItem label="Moyens de paiement" icon="💳" />
        <MenuItem label="Notifications" icon="🔔" />
        <MenuItem label="Aide & support" icon="🆘" />
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
    </View>
  );
}

function MenuItem({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={styles.menuItem}>
      <Text style={{ fontSize: 20, marginRight: 14 }}>{icon}</Text>
      <Text style={{ ...typography.body, flex: 1 }}>{label}</Text>
      <Text style={{ color: colors.slate, fontSize: 20 }}>›</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand, paddingTop: 70, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.ocean, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: colors.white, fontSize: 24, fontWeight: '800' },
  menu: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  logoutBtn: { marginTop: 30, alignItems: 'center', paddingVertical: 16 },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
});
