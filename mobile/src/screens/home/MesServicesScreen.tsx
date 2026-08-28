import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { colors, radius } from '../../theme/colors';
import { SERVICES } from '../../constants/services';

const CARD_HEIGHT = 220;

export default function MesServicesScreen({ navigation }: any) {
  function openServiceCard(service: typeof SERVICES[number]) {
    if (service.type === 'MAP') {
      navigation.navigate('MapExplore');
    } else if (service.type === 'BUS') {
      navigation.navigate('TripSearch', { type: 'BUS' });
    } else if (service.type === 'VOITURE') {
      navigation.navigate('AvailableVehicles', { type: 'VOITURE', purpose: service.purpose, title: service.title });
    } else {
      navigation.navigate('AgencyList', { type: 'CAMION', purpose: service.purpose });
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 50 }}>
      <Text style={styles.display}>Mes services</Text>
      <Text style={styles.bodyMuted}>Choisissez le type de trajet qui correspond à votre besoin.</Text>

      <View style={{ marginTop: 24 }}>
        {SERVICES.map((s) => (
          <Pressable key={s.key} style={styles.card} onPress={() => openServiceCard(s)}>
            {/* La photo occupe tout le bloc, comme les cartes "Visitez les Comores" */}
            {s.image ? (
              <Image source={s.image} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, styles.placeholder, { backgroundColor: (s as any).bg || colors.ocean }]}>
                <Text style={styles.placeholderIcon}>{(s as any).icon || '🚐'}</Text>
              </View>
            )}
            {/* Une seule teinte transparente sur toute la carte, le texte fait corps avec la photo */}
            <View style={styles.overlay} />

            <View style={styles.textBlock}>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.subtitle}>{s.description}</Text>
              <Pressable style={styles.ctaBtn} onPress={() => openServiceCard(s)}>
                <Text style={styles.ctaText}>{s.cta} →</Text>
              </Pressable>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sand },
  display: { fontSize: 28, fontWeight: '800', color: colors.charcoal },
  bodyMuted: { fontSize: 14, color: colors.slate, marginTop: 6 },
  card: {
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 18,
    backgroundColor: colors.sandDeep,
    justifyContent: 'flex-end',
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,10,14,0.38)' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { fontSize: 56 },
  textBlock: { padding: 18 },
  title: { fontSize: 19, fontWeight: '800', color: colors.white },
  subtitle: { fontSize: 12.5, color: 'rgba(255,255,255,0.92)', marginTop: 5, lineHeight: 18 },
  ctaBtn: { alignSelf: 'flex-start', backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 10, marginTop: 14 },
  ctaText: { fontSize: 12.5, fontWeight: '800', color: colors.onyx },
});
