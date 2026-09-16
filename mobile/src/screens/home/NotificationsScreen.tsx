import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, radius, typography } from '../../theme/colors';
import { api } from '../../services/api';

interface Notif { id: string; title: string; body: string; read: boolean; createdAt: string }

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      api.get('/notifications/mine').then(({ data }) => { if (active) setNotifications(data); }).finally(() => active && setLoading(false));
      return () => { active = false; };
    }, [])
  );

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Retour</Text></Pressable>
        <Text style={typography.display}>Notifications</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ocean} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <Pressable style={[styles.card, !item.read && styles.cardUnread]} onPress={() => markRead(item.id)}>
              {!item.read && <View style={styles.unreadDot} />}
              <Text style={typography.h2}>{item.title}</Text>
              <Text style={typography.bodyMuted}>{item.body}</Text>
              <Text style={typography.caption}>
                {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={typography.bodyMuted}>Aucune notification pour le moment.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  back: { color: colors.ocean, fontWeight: '600', marginBottom: 14, fontSize: 15 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.line, gap: 4 },
  cardUnread: { borderColor: colors.gold },
  unreadDot: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold },
});
